/**
 * Cliente de API do Shandon Elite (lado do navegador).
 *
 * O problema que este arquivo resolve: as telas chamavam
 * `${CF_API_BASE}/api/...`, e `CF_API_BASE` apontava para
 * https://senhoramorim.com.br — um Worker SEPARADO. Várias das rotas nem
 * existem lá (verificado: /api/username-enum, /api/breach-check,
 * /api/ip-intel, /api/domain-intel, /api/image-forensics, /api/social-check,
 * /api/telegram-osint, /api/wayback-check, /api/subdomain-finder,
 * /api/ssl-tracker devolvem 404), enquanto a rota local existe e funciona.
 *
 * Some com isso o resultado era sempre o mesmo: 404 com corpo VAZIO, o
 * `res.json()` lançava `SyntaxError`, e o `catch` mostrava a mensagem
 * genérica "Falha na conexão" — sem dizer qual ferramenta falhou nem por quê.
 *
 * A regra agora é:
 *   1. As rotas do próprio app são chamadas na mesma origem (`/api/...`).
 *      Sem CORS, sem servidor de terceiros, sem 404.
 *   2. Se `NEXT_PUBLIC_SHANDON_API_BASE` estiver definido, ele é usado como
 *      segunda opção — útil quando o contêiner do Cloudflare pode dormir e
 *      existe um Worker sempre ligado com as mesmas rotas.
 *   3. O corpo da resposta é lido como texto antes do JSON, para que resposta
 *      vazia ou HTML de proxy vire um erro legível em vez de um SyntaxError
 *      engolido por um catch.
 */

import { PUBLIC_CENTRAL_API_BASE } from './cfapi'

export interface ApiOk<T> {
  ok: true
  data: T
  /** De onde a resposta veio. */
  via: ApiVia
  status: number
}

export interface ApiFail {
  ok: false
  error: string
  status?: number
  via: ApiVia
  /** Tentativas feitas, para diagnóstico. */
  tentados: string[]
}

export type ApiResult<T> = ApiOk<T> | ApiFail
export type ApiVia = 'local' | 'central' | 'nenhuma'

export interface ApiCallOptions {
  method?: string
  body?: unknown
  headers?: Record<string, string>
  signal?: AbortSignal
  /** Rotas a tentar, em ordem, em vez do padrão `['/api/...']`. */
  path?: string
}

function join(base: string, path: string): string {
  if (!base) return path
  return `${base.replace(/\/$/, '')}${path}`
}

/**
 * Ordem das tentativas. A mesma origem vem primeiro de propósito: é a única
 * que garante que a rota existe, porque ela é deste mesmo repositório.
 */
function candidatesFor(path: string): { base: string; via: ApiVia }[] {
  const out: { base: string; via: ApiVia }[] = [{ base: '', via: 'local' }]
  if (PUBLIC_CENTRAL_API_BASE) {
    out.push({ base: PUBLIC_CENTRAL_API_BASE, via: 'central' })
  }
  return out
}

interface Attempt {
  url: string
  via: ApiVia
}

async function attempt<T>(
  attemptInfo: Attempt,
  opts: ApiCallOptions,
  timeoutMs: number
): Promise<{ ok: true; data: T; status: number } | { ok: false; status: number; reason: string }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  if (opts.signal) {
    if (opts.signal.aborted) {
      clearTimeout(timer)
      return { ok: false, status: 0, reason: 'consulta cancelada' }
    }
    opts.signal.addEventListener('abort', () => controller.abort(), { once: true })
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers || {}),
  }

  try {
    const res = await fetch(attemptInfo.url, {
      method: opts.method || 'POST',
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      signal: controller.signal,
    })

    // Ler como texto primeiro. Um 404 de proxy costuma vir com corpo HTML ou
    // totalmente vazio, e `res.json()` nesses casos lança antes de a gente
    // conseguir mostrar qualquer mensagem útil.
    const raw = await res.text()
    let parsed: unknown = undefined
    if (raw.trim().length > 0) {
      try {
        parsed = JSON.parse(raw)
      } catch {
        parsed = undefined
      }
    }

    if (!res.ok) {
      const fromBody =
        parsed && typeof parsed === 'object' && 'error' in (parsed as Record<string, unknown>)
          ? String((parsed as Record<string, unknown>).error)
          : null
      const reason = fromBody
        || (raw.trim() ? `HTTP ${res.status} do servidor` : `HTTP ${res.status}, resposta vazia`)
      return { ok: false, status: res.status, reason }
    }

    if (parsed === undefined) {
      return { ok: false, status: res.status, reason: 'o servidor respondeu sem JSON válido' }
    }

    return { ok: true, data: parsed as T, status: res.status }
  } catch (err) {
    const isAbort = err instanceof DOMException && err.name === 'AbortError'
    const isTimeout = controller.signal.aborted && !opts.signal?.aborted
    const reason = isTimeout
      ? `tempo esgotado (${Math.round(timeoutMs / 1000)}s)`
      : isAbort
        ? 'consulta cancelada'
        : err instanceof Error
          ? err.message
          : 'erro de rede'
    return { ok: false, status: 0, reason }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Chama uma rota da API do próprio Shandon Elite, com resposta sempre
 * tipada e nunca uma exceção. Resolva em `ApiResult<T>`.
 */
export async function apiFetch<T>(opts: ApiCallOptions = {}): Promise<ApiResult<T>> {
  const path = opts.path || '/api'
  const timeoutMs = 45_000
  const tentados: string[] = []
  let lastReason = 'nenhuma tentativa foi feita'

  for (const candidate of candidatesFor(path)) {
    const url = join(candidate.base, path)
    tentados.push(url)
    const r = await attempt<T>({ url, via: candidate.via }, opts, timeoutMs)
    if (r.ok) {
      return { ok: true, data: r.data, via: candidate.via, status: r.status }
    }
    lastReason = r.reason
    // Cancelamento é do usuário: não faz sentido tentar o próximo servidor.
    if (lastReason === 'consulta cancelada') {
      return { ok: false, error: lastReason, status: r.status, via: 'nenhuma', tentados }
    }
  }

  return {
    ok: false,
    error: lastReason,
    via: 'nenhuma',
    tentados,
  }
}

/**
 * Atalho para a API do próprio app. A forma mais comum de uso:
 *
 *   const r = await apiPost<{ success: boolean; data: unknown }>('/api/foo', { a: 1 })
 *   if (!r.ok) { setError(r.error); return }
 *   setData(r.data)
 */
export function apiPost<T>(path: string, body?: unknown, extra?: Omit<ApiCallOptions, 'path' | 'body' | 'method'>) {
  return apiFetch<T>({ path, body, method: 'POST', ...extra })
}

export function apiGet<T>(path: string, extra?: Omit<ApiCallOptions, 'path' | 'method'>) {
  return apiFetch<T>({ path, method: 'GET', ...extra })
}
