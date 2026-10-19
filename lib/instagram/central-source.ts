/**
 * Fonte autoritativa de Instagram: o Worker da Central Amorim.
 *
 * Por que não dá para confiar no scraping direto (lib/instagram/public.ts):
 * o Shandon roda em Cloudflare Workers, e o Instagram bloqueia os ranges de IP
 * do Cloudflare. A resposta é 403/429 ou a tela de login, e o parser não acha
 * nenhum dado. Antes disso o resultado virava "perfil não encontrado", que é
 * mentira — o perfil existia e era público.
 *
 * A Central Amorim já tem esse caminho resolvido: /api/instagram usa o Apify,
 * que responde mesmo de datacenter, e é a mesma rota que já retorna o perfil
 * completo (nome, seguidores, posts, foto). O token do Apify fica no Worker
 * da Central como secret; aqui só entra a chamada HTTP, sem nenhuma credencial
 * no código e muito menos no frontend.
 *
 * A cota é global e fica no D1 da Central (paid_quota), então continuar
 * chamando daqui não abre brecha de gasto.
 */

import type { SocialProfile } from '../social-providers'

const CENTRAL_BASE = (
  process.env.CENTRAL_API_BASE ||
  process.env.NEXT_PUBLIC_SHANDON_API_BASE ||
  'https://senhoramorim.com.br'
).replace(/\/$/, '')

const DEFAULT_TIMEOUT_MS = 20_000

export type InstagramSourceOutcome =
  | { kind: 'ok'; profile: SocialProfile }
  | { kind: 'not_found' }
  | { kind: 'private'; profile: SocialProfile }
  | { kind: 'not_configured' }
  | { kind: 'rate_limited' }
  | { kind: 'auth_error' }
  | { kind: 'unavailable'; detail: string }
  | { kind: 'invalid_input'; detail: string }

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const n = Number(value.replace(/[^\d]/g, ''))
    return Number.isFinite(n) && value.trim() !== '' ? n : null
  }
  return null
}

function mapProfile(data: Record<string, unknown>, username: string): SocialProfile {
  const p = (data.profile || {}) as Record<string, unknown>
  const profileUrl = typeof p.externalUrl === 'string' && p.externalUrl.startsWith('http')
    ? p.externalUrl
    : `https://www.instagram.com/${username}/`

  return {
    platform: 'Instagram',
    username: typeof p.username === 'string' ? p.username : username,
    displayName: (typeof p.fullName === 'string' && p.fullName) || `@${username}`,
    fullName: typeof p.fullName === 'string' ? p.fullName : '',
    bio: typeof p.biography === 'string' ? p.biography : null,
    avatarUrl: typeof p.profilePicUrlHD === 'string'
      ? p.profilePicUrlHD
      : (typeof p.profilePicUrl === 'string' ? p.profilePicUrl : null),
    profileUrl,
    followers: toNumber(p.followersCount),
    following: toNumber(p.followsCount),
    posts: toNumber(p.postsCount),
    likes: null,
    isVerified: p.verified === true,
    isPrivate: p.isPrivate === true,
    isBusiness: p.isBusiness === true,
    externalUrl: typeof p.externalUrl === 'string' ? p.externalUrl : null,
    category: typeof p.businessCategory === 'string' ? p.businessCategory : null,
    publicEmail: null,
    publicPhone: null,
    city: null,
    work: null,
    education: null,
    friends: null,
    videos: null,
    website: typeof p.externalUrl === 'string' ? p.externalUrl : null,
    extra: {},
    fetchedAt: Date.now(),
    source: 'central-apify' as unknown as SocialProfile['source'],
  }
}

/**
 * Consulta o perfil. Nunca lança: devolve um discriminador para o chamador
 * diferenciar "não existe" de "a API falhou".
 */
export async function fetchInstagramFromCentral(
  username: string,
  options?: { timeout?: number; baseUrl?: string }
): Promise<InstagramSourceOutcome> {
  const base = (options?.baseUrl || CENTRAL_BASE).replace(/\/$/, '')
  const url = `${base}/api/instagram`
  const timeout = options?.timeout ?? DEFAULT_TIMEOUT_MS

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username }),
      signal: AbortSignal.timeout(timeout),
    })
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'erro desconhecido'
    return { kind: 'unavailable', detail: `não foi possível alcançar a Central: ${detail}` }
  }

  if (res.status === 429) {
    return { kind: 'rate_limited' }
  }

  let body: Record<string, unknown> = {}
  const raw = await res.text()
  if (raw) {
    try {
      body = JSON.parse(raw) as Record<string, unknown>
    } catch {
      return { kind: 'unavailable', detail: `resposta da Central não é JSON (HTTP ${res.status})` }
    }
  }

  if (res.status === 401 || res.status === 403) {
    return { kind: 'auth_error' }
  }

  if (res.status >= 500) {
    return { kind: 'unavailable', detail: `Central respondeu HTTP ${res.status}` }
  }

  const data = (body.data || {}) as Record<string, unknown>
  const errors = Array.isArray(data.errors) ? (data.errors as string[]) : []

  // A Central é quem sabe se a chave existe. Sem chave, o honesto é dizer que
  // a fonte não está disponível — não inventar perfil inexistente.
  if (data.configured === false) {
    return { kind: 'not_configured' }
  }

  if (errors.some((e) => /limite di[áa]rio|rate limit/i.test(e))) {
    return { kind: 'rate_limited' }
  }

  if (errors.some((e) => /n[ãa]o configurada|chave apify/i.test(e))) {
    return { kind: 'not_configured' }
  }

  if (data.profile && typeof data.profile === 'object') {
    const profile = mapProfile(data, username)
    return profile.isPrivate ? { kind: 'private', profile } : { kind: 'ok', profile }
  }

  if (errors.some((e) => /n[ãa]o encontrado|privado|inexistente/i.test(e))) {
    return { kind: 'not_found' }
  }

  // Sucesso sem perfil e sem erro conhecido: formato inesperado, não ausência.
  return { kind: 'unavailable', detail: 'resposta sem perfil e sem erro reconhecido' }
}

/** Texto para o card, por desfecho. Nunca diz "não encontrado" sem prova. */
export function outcomeToMessage(outcome: InstagramSourceOutcome): string {
  switch (outcome.kind) {
    case 'ok':
      return 'Perfil encontrado via fonte confiável (Apify).'
    case 'private':
      return 'Perfil encontrado, mas é privado. Só dados públicos.'
    case 'not_found':
      return 'Nenhum perfil encontrado no Instagram.'
    case 'not_configured':
      return 'A fonte de dados do Instagram não está configurada no servidor.'
    case 'rate_limited':
      return 'A consulta ao Instagram atingiu o limite de hoje. Tente mais tarde.'
    case 'auth_error':
      return 'A fonte de dados do Instagram recusou a consulta (permissão).'
    case 'invalid_input':
      return outcome.detail
    default:
      return `A consulta ao Instagram falhou: ${outcome.detail}`
  }
}
