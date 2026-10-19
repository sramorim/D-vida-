import type { SearchResult } from './types.ts'
import { classifySite, type Verdict } from './bot-protection'

interface SiteConfig {
  name: string
  url: string
  errorType: 'status' | 'message'
  errorMsg?: string
  category: string
}

const SITES: SiteConfig[] = [
  { name: 'Instagram', url: 'https://www.instagram.com/{username}/', errorType: 'status', category: 'redes-sociais' },
  { name: 'Facebook', url: 'https://www.facebook.com/{username}', errorType: 'status', category: 'redes-sociais' },
  { name: 'X (Twitter)', url: 'https://x.com/{username}', errorType: 'status', category: 'redes-sociais' },
  { name: 'TikTok', url: 'https://www.tiktok.com/@{username}', errorType: 'message', errorMsg: 'Couldn\'t find this account', category: 'redes-sociais' },
  { name: 'LinkedIn', url: 'https://www.linkedin.com/in/{username}', errorType: 'status', category: 'redes-sociais' },
  { name: 'Pinterest', url: 'https://www.pinterest.com/{username}/', errorType: 'status', category: 'redes-sociais' },
  { name: 'Telegram', url: 'https://t.me/{username}', errorType: 'message', errorMsg: 'If you have <strong>Telegram</strong>', category: 'redes-sociais' },
  { name: 'Reddit', url: 'https://www.reddit.com/user/{username}', errorType: 'status', category: 'redes-sociais' },
  { name: 'Threads', url: 'https://www.threads.net/@{username}', errorType: 'status', category: 'redes-sociais' },
  { name: 'YouTube', url: 'https://www.youtube.com/@{username}', errorType: 'status', category: 'video' },
  { name: 'Twitch', url: 'https://www.twitch.tv/{username}', errorType: 'status', category: 'video' },
  { name: 'GitHub', url: 'https://github.com/{username}', errorType: 'status', category: 'dev' },
  { name: 'GitLab', url: 'https://gitlab.com/{username}', errorType: 'status', category: 'dev' },
  { name: 'Dev.to', url: 'https://dev.to/{username}', errorType: 'status', category: 'dev' },
  { name: 'HackerNews', url: 'https://news.ycombinator.com/user?id={username}', errorType: 'message', errorMsg: 'No such user', category: 'dev' },
  { name: 'Spotify', url: 'https://open.spotify.com/user/{username}', errorType: 'status', category: 'musica' },
  { name: 'SoundCloud', url: 'https://soundcloud.com/{username}', errorType: 'status', category: 'musica' },
  { name: 'Behance', url: 'https://www.behance.net/{username}', errorType: 'status', category: 'musica' },
  { name: 'Dribbble', url: 'https://dribbble.com/{username}', errorType: 'status', category: 'musica' },
  { name: 'Steam', url: 'https://steamcommunity.com/id/{username}', errorType: 'message', errorMsg: 'The specified profile could not be found', category: 'gaming' },
  { name: 'Medium', url: 'https://medium.com/@{username}', errorType: 'status', category: 'business' },
  { name: 'Gravatar', url: 'https://en.gravatar.com/{username}', errorType: 'status', category: 'business' },
  { name: 'Keybase', url: 'https://keybase.io/{username}', errorType: 'status', category: 'business' },
  { name: 'npm', url: 'https://www.npmjs.com/~{username}', errorType: 'status', category: 'dev' },
  { name: 'Vercel', url: 'https://vercel.com/{username}', errorType: 'status', category: 'dev' },
]

interface CheckResult {
  site: string
  url: string
  exists: boolean
  status: string
  verdict: Verdict
  message: string
  httpStatus: number
  responseTime: number
  category: string
}

async function checkSite(site: SiteConfig, username: string): Promise<CheckResult> {
  const url = site.url.replace('{username}', username)
  const start = Date.now()

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      redirect: 'follow',
      signal: controller.signal,
    })

    clearTimeout(timeout)
    const elapsed = Date.now() - start
    const status = response.status

    // Só a checagem por corpo precisa ler o HTML. Nos demais casos o status
    // HTTP já basta, e ler o corpo de 26 sites só gasta cota do Worker.
    let bodySaysNotFound: boolean | undefined
    let contentLooksLikeProfile: boolean | undefined

    if (site.errorType === 'message') {
      const body = await response.text()
      bodySaysNotFound = status === 200 && body.includes(site.errorMsg || '')
      // Página de perfil costuma ter título e imagem; a tela de login/muro
      // do Instagram não tem. Sem isso, um 200 vazio seria tratado como achado.
      contentLooksLikeProfile = status === 200 && !bodySaysNotFound
    }

    const classified = classifySite({
      site: site.name,
      httpStatus: status,
      bodySaysNotFound,
      contentLooksLikeProfile,
    })

    return {
      site: site.name,
      url,
      exists: classified.exists,
      status: classified.uiStatus,
      verdict: classified.verdict,
      message: classified.message,
      httpStatus: status,
      responseTime: elapsed,
      category: site.category,
    }
  } catch (err) {
    return {
      site: site.name,
      url,
      exists: false,
      status: 'unavailable',
      verdict: 'unavailable' as Verdict,
      message: `Não foi possível consultar ${site.name} (tempo limite ou rede).`,
      httpStatus: 0,
      responseTime: Date.now() - start,
      category: site.category,
    }
  }
}

export async function runHttpCheck(
  username: string,
  categories?: string[]
): Promise<SearchResult[]> {
  let sites = SITES

  if (categories && categories.length > 0) {
    sites = SITES.filter((s) => categories.includes(s.category))
  }

  const sitePromises = sites.map((site) => checkSite(site, username))
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Timeout')), 8000)
  })

  let results: CheckResult[]
  try {
    results = await Promise.race([Promise.all(sitePromises), timeoutPromise])
  } catch {
    const settled = await Promise.allSettled(sitePromises)
    results = settled
      .filter((r): r is PromiseFulfilledResult<CheckResult> => r.status === 'fulfilled')
      .map((r) => r.value)
  }

  return results.map((r) => ({
    id: `http-${r.site.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    platform: r.site,
    username,
    // "Não encontrado" só aparece quando o site disse 404 de verdade. Para
    // bloqueio e indisponível o texto explica o que aconteceu, para o
    // operador não concluir que o perfil não existe.
    displayName: r.exists ? `@${username}` : r.status === 'not_found' ? 'Não encontrado' : 'Indefinido',
    score: r.verdict === 'found' ? 90 : r.verdict === 'private' ? 85 : r.verdict === 'possible' ? 55 : r.verdict === 'unavailable' ? 10 : 0,
    bio: r.message,
    url: r.url,
    exists: r.exists,
    status: r.status,
    httpStatus: r.httpStatus,
    source: 'http-checker' as const,
    timestamp: Date.now(),
    extra: {
      responseTime: r.responseTime,
      category: r.category,
      verdict: r.verdict,
      // Motivo técnico, para o log e o diagnóstico — a nota explica em texto.
      motivo: r.status === 'possible'
        ? 'plataforma bloqueia consulta automatizada ou respondeu sem dados do perfil'
        : r.status === 'unavailable'
          ? 'timeout, erro de rede ou erro do servidor da plataforma'
          : null,
    },
  }))
}

export function getAvailableCategories(): string[] {
  const cats = new Set(SITES.map((s) => s.category))
  return Array.from(cats)
}

export function getSitesCount(): number {
  return SITES.length
}
