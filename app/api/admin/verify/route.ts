import { NextRequest, NextResponse } from 'next/server'
import { createToken } from '@/lib/auth'
import type { ApiResponse } from '@/lib/types'

/**
 * Verificação de administrador no SERVIDOR.
 *
 * Antes, o painel comparava a senha com `NEXT_PUBLIC_ADMIN_KEY` dentro do
 * navegador. Essa variável é pública por definição: o Next.js embute o valor
 * no bundle JavaScript. Qualquer pessoa abria o DevTools, lia a senha no
 * código e entrava. A comparação inteira acontecia no cliente, então não
 * havia servidor envolvido — não era autenticação, era uma caixa de texto
 * decorativa.
 *
 * Aqui a senha é comparada com `SHANDON_ADMIN_KEY`, que é secreta do
 * servidor, e o acesso é registrado em cookie httpOnly. `NEXT_PUBLIC_ADMIN_KEY`
 * deixou de ser lido por este caminho de propósito.
 */

const COOKIE_ADMIN = 'shandon_admin'
const MAX_TENTATIVAS = 5
const JANELA_MS = 5 * 60 * 1000

/** Tentativas por IP. Em memória: vale como trava de ruído, não como cofre. */
const tentativas = new Map<string, { falhas: number; ate: number }>()

function chaveDeIp(request: NextRequest): string {
  const fwd = request.headers.get('x-forwarded-for')
  return (fwd ? fwd.split(',')[0] : request.headers.get('x-real-ip') || 'unknown').trim()
}

function estado(chave: string): { falhas: number; ate: number } {
  const atual = tentativas.get(chave)
  if (!atual || atual.ate < Date.now()) {
    const novo = { falhas: 0, ate: Date.now() + JANELA_MS }
    tentativas.set(chave, novo)
    return novo
  }
  return atual
}

export const maxDuration = 30

export async function POST(request: NextRequest) {
  const chave = chaveDeIp(request)
  const est = estado(chave)

  if (est.falhas >= MAX_TENTATIVAS) {
    const segundos = Math.ceil((est.ate - Date.now()) / 1000)
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: `Muitas tentativas. Tente de novo em ${segundos}s.` },
      { status: 429, headers: { 'Retry-After': String(segundos) } }
    )
  }

  // A senha esperada nunca sai do servidor. Se não estiver configurada, o
  // painel fica fechado e inerte — melhor do que aberto.
  const esperada = process.env.SHANDON_ADMIN_KEY
  if (!esperada) {
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: 'Painel administrativo desativado: SHANDON_ADMIN_KEY não configurado no servidor.',
      },
      { status: 503 }
    )
  }

  const body = (await request.json().catch(() => ({}))) as { password?: unknown }
  const senha = typeof body.password === 'string' ? body.password : ''

  if (!senha) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Informe a senha.' },
      { status: 400 }
    )
  }

  const confere = await comparaEmTempoConstante(senha, esperada)
  if (!confere) {
    est.falhas += 1
    const restantes = MAX_TENTATIVAS - est.falhas
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: restantes > 0
          ? `Senha incorreta. ${restantes} tentativa(s) restante(s).`
          : 'Senha incorreta. Aguarde alguns minutos.',
      },
      { status: 401 }
    )
  }

  tentativas.delete(chave)

  // Email do dono: o mesmo que lib/auth.ts usa em requireAdmin, para o JWT do
  // admin valer nas rotas que exigem requireAdmin.
  const email = (process.env.SHANDON_ADMIN_EMAILS || '').split(',')[0]?.trim()
    || 'admin@shandon.local'

  const token = await createToken({
    userId: 'admin',
    email,
    tier: 'premium',
  })

  const res = NextResponse.json<ApiResponse<{ email: string }>>({
    success: true,
    data: { email },
  })

  res.cookies.set(COOKIE_ADMIN, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 8,
  })
  return res
}

/** Duração igual, comparação byte a byte, sem sair no primeiro erro. */
async function comparaEmTempoConstante(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder()
  const ba = enc.encode(a)
  const bb = enc.encode(b)
  const max = Math.max(ba.length, bb.length)
  let diff = ba.length ^ bb.length
  for (let i = 0; i < max; i++) {
    diff |= (ba[i] ?? 0) ^ (bb[i] ?? 0)
  }
  return diff === 0
}
