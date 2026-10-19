import { NextRequest, NextResponse } from 'next/server'
import { runMaigret, checkMaigretAvailable, maigretResultToSearchResult } from '@/lib/maigret'
import { runSherlock, checkSherlockAvailable } from '@/lib/sherlock'
import { runHttpCheck } from '@/lib/http-checker'
import { runUsernameEnum } from '@/lib/username-enum'
import { fetchAllSocialProfiles, profileToSearchResult } from '@/lib/social-providers'
import { fetchInstagramFromCentral, outcomeToMessage } from '@/lib/instagram/central-source'
import { normalizeUsername } from '@/lib/username-normalize'
import { validateApiKey, extractApiKeyFromHeaders } from '@/lib/auth-core'
import { UsernameSearchRequest, SearchResult, ApiResponse } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const authKey = extractApiKeyFromHeaders(
      request.headers.get('authorization'),
      request.headers.get('x-api-key'),
      new URL(request.url).searchParams.get('key')
    )
    const auth = validateApiKey(authKey, process.env.SHANDON_API_KEY)
    if (!auth.authenticated) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: auth.error || 'Não autorizado',
      }, { status: 401 })
    }

    const body: UsernameSearchRequest = await request.json()
    const { target, modules = ['todos'] } = body

    // Normalização em um único lugar: aceita "@sr__amorim", "sr__amorim",
    // "  @sr__amorim  " e link colado, e devolve sempre o mesmo username.
    const normalized = normalizeUsername(target)
    if (!normalized.ok) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: normalized.error,
      }, { status: 400 })
    }
    const username = normalized.username

    const allResults: SearchResult[] = []
    const enginesUsed: string[] = []

    // Engine 1: HTTP Checker (always available)
    const httpResults = await runHttpCheck(username)
    allResults.push(...httpResults)
    enginesUsed.push('http-checker')

    // Engine 1b: enumerador nativo (TypeScript puro, 119 plataformas). O
    // HTTP Checker sozinho cobria 25 sites; aqui a varredura sobe para ~119
    // sem depender de nenhum binário Python instalado.
    try {
      const enumResults = await runUsernameEnum(username)
      for (const er of enumResults) {
        const existing = allResults.find(
          (r) => r.platform.toLowerCase() === er.platform.toLowerCase()
        )
        if (existing) {
          if (er.exists && !existing.exists) {
            existing.exists = true
            existing.status = 'found'
            existing.score = er.score
            existing.extra = { ...existing.extra, ...er.extra, engine: 'username-enum' }
          }
        } else {
          allResults.push(er)
        }
      }
      enginesUsed.push('username-enum')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      enginesUsed.push(`username-enum (erro: ${msg})`)
    }

    // Engine 2: Maigret (if available)
    const maigretAvailable = await checkMaigretAvailable().catch(() => false)
    if (maigretAvailable) {
      try {
        const maigretResults = await runMaigret(username, modules)
        const converted = maigretResults.map((r) => maigretResultToSearchResult(r, username))

        for (const mr of converted) {
          const existing = allResults.find(
            (r) => r.platform.toLowerCase() === mr.platform.toLowerCase()
          )
          if (existing) {
            if (mr.exists && !existing.exists) {
              existing.exists = true
              existing.status = 'found'
              existing.score = mr.score
              existing.extra = { ...existing.extra, ...mr.extra, engine: 'maigret' }
            }
          } else {
            allResults.push(mr)
          }
        }
        enginesUsed.push('maigret')
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erro desconhecido'
        enginesUsed.push(`maigret (erro: ${msg})`)
      }
    }

    // Engine 3: Sherlock (if available)
    const sherlockAvailable = await checkSherlockAvailable().catch(() => false)
    if (sherlockAvailable) {
      try {
        const sherlockResults = await runSherlock(username)

        for (const sr of sherlockResults) {
          const existing = allResults.find(
            (r) => r.platform.toLowerCase() === sr.platform.toLowerCase()
          )
          if (existing) {
            if (sr.exists && !existing.exists) {
              existing.exists = true
              existing.status = 'found'
              existing.score = sr.score
              existing.extra = { ...existing.extra, ...sr.extra, engine: 'sherlock' }
            }
          } else {
            allResults.push({
              id: sr.id,
              platform: sr.platform,
              username: sr.username,
              displayName: sr.displayName,
              score: sr.score,
              url: sr.url,
              exists: sr.exists,
              httpStatus: sr.httpStatus,
              status: sr.exists ? 'found' : 'not_found',
              source: 'username-enum' as const,
              timestamp: Date.now(),
              extra: { ...sr.extra, engine: 'sherlock' }
            })
          }
        }
        enginesUsed.push('sherlock')
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erro desconhecido'
        enginesUsed.push(`sherlock (erro: ${msg})`)
      }
    }

    const socialPlatforms = ['instagram', 'github', 'telegram', 'tiktok', 'reddit', 'facebook']
    const sessionCookie = request.headers.get('x-ig-session') ?? undefined
    const proxyUrl = request.headers.get('x-proxy-url') ?? process.env.SHANDON_PROXY_URL ?? undefined

    try {
      const socialProfiles = await fetchAllSocialProfiles(
        socialPlatforms,
        username,
        { sessionCookie, proxyUrl },
        3
      )

      for (const profile of socialProfiles) {
        const searchResult = profileToSearchResult(profile)
        const existing = allResults.find(
          (r) => r.platform.toLowerCase() === profile.platform.toLowerCase()
        )
        if (existing) {
          existing.exists = true
          existing.status = 'found'
          existing.score = searchResult.score
          existing.displayName = searchResult.displayName
          existing.bio = searchResult.bio
          existing.avatar = searchResult.avatar
          existing.followers = searchResult.followers
          existing.following = searchResult.following
          existing.posts = searchResult.posts
          existing.url = searchResult.url
          existing.extra = { ...existing.extra, ...searchResult.extra, source: profile.source }
        } else {
          allResults.push(searchResult as SearchResult)
        }
      }
      if (socialProfiles.length > 0) {
        enginesUsed.push(`social-providers (${socialProfiles.map(p => p.platform).join(', ')})`)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      enginesUsed.push(`social-providers (erro: ${msg})`)
    }

    // Engine 5 — Instagram: fonte autoritativa na Central Amorim (Apify).
    //
    // Os motores acima não servem para o Instagram quando rodam em Cloudflare:
    // o Instagram bloqueia o IP do datacenter, o http-checker recebia 403/429 e
    // convertia em "perfil não encontrado", e o social-providers não achava
    // nenhum dado e sumia em silêncio. O resultado na tela era um perfil público
    // reportado como inexistente.
    //
    // Aqui a Central responde (Apify não é bloqueado), e o desfecho é sempre
    // explícito: achou, não achou, privado, fonte sem chave, limite ou falha.
    // Em caso de falha da fonte, a linha do Instagram passa a explicar o
    // problema — nunca vira "não encontrado".
    if (modules.includes('todos') || modules.includes('instagram')) {
      const outcome = await fetchInstagramFromCentral(username)

      const applyOutcome = (patch: Partial<SearchResult>) => {
        const existing = allResults.find(
          (r) => r.platform.toLowerCase() === 'instagram'
        )
        if (existing) {
          Object.assign(existing, patch)
        } else {
          allResults.push({
            id: `central-instagram-${username.toLowerCase()}`,
            platform: 'Instagram',
            username,
            displayName: `@${username}`,
            score: 0,
            url: `https://www.instagram.com/${username}/`,
            source: 'http-checker' as const,
            timestamp: Date.now(),
            ...patch,
          } as SearchResult)
        }
      }

      switch (outcome.kind) {
        case 'ok':
        case 'private': {
          const sr = profileToSearchResult(outcome.profile)
          applyOutcome({
            ...sr,
            exists: true,
            status: 'found',
            score: outcome.kind === 'private' ? 85 : 95,
            bio: outcomeToMessage(outcome),
            extra: { ...(sr.extra || {}), engine: 'central-apify', fonte: 'apify' },
          } as Partial<SearchResult>)
          enginesUsed.push(`central-instagram (${outcome.kind})`)
          break
        }
        case 'not_found':
          applyOutcome({
            exists: false,
            status: 'not_found',
            score: 0,
            bio: outcomeToMessage(outcome),
            extra: { engine: 'central-apify', motivo: 'fonte respondeu que o perfil não existe' },
          } as Partial<SearchResult>)
          enginesUsed.push('central-instagram (not_found)')
          break
        case 'not_configured':
        case 'rate_limited':
        case 'auth_error':
        case 'unavailable':
          applyOutcome({
            exists: false,
            status: outcome.kind === 'not_configured' ? 'unavailable' : 'possible',
            score: outcome.kind === 'not_configured' ? 10 : 20,
            bio: outcomeToMessage(outcome),
            extra: {
              engine: 'central-apify',
              desfecho: outcome.kind,
              detalhe: outcome.kind === 'unavailable' ? outcome.detail : undefined,
            },
          } as Partial<SearchResult>)
          enginesUsed.push(`central-instagram (${outcome.kind})`)
          break
        default:
          break
      }
    }

    // Sort results: found first, then by score
    allResults.sort((a, b) => {
      if (a.exists && !b.exists) return -1
      if (!a.exists && b.exists) return 1
      return (b.score || 0) - (a.score || 0)
    })

    const foundResults = allResults.filter((r) => r.exists)
    const notFoundResults = allResults.filter((r) => !r.exists)

    return NextResponse.json<ApiResponse<{ results: SearchResult[]; meta: { engines: string[]; totalFound: number; totalChecked: number } }>>({
      success: true,
      data: {
        results: allResults,
        meta: {
          engines: enginesUsed,
          totalFound: foundResults.length,
          totalChecked: allResults.length,
        },
      },
    }, {
      headers: {
        'X-Total-Results': allResults.length.toString(),
        'X-Found-Results': foundResults.length.toString(),
        'X-Not-Found-Results': notFoundResults.length.toString(),
        'X-Engines': enginesUsed.join(', '),
      }
    })
  } catch (error) {
    console.error('Username search error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'

    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Erro na busca',
      details: errorMessage,
    }, { status: 500 })
  }
}

export async function GET() {
  const maigret = await checkMaigretAvailable().catch(() => false)

  return NextResponse.json({
    engines: {
      'http-checker': { available: true, sites: 26, type: 'nativo' },
      maigret: { available: maigret, sites: 3000, type: 'python-cli' },
      sherlock: { available: true, sites: 400, type: 'python-cli' },
    },
    socialProviders: {
      instagram: { available: true, type: 'og-tags+embedded-json', data: ['name', 'bio', 'followers', 'following', 'avatar', 'verified', 'email', 'phone'] },
      github: { available: true, type: 'rest-api', data: ['name', 'bio', 'followers', 'following', 'repos', 'avatar', 'location', 'company', 'email'] },
      telegram: { available: true, type: 'html-scrape', data: ['name', 'bio', 'avatar'] },
      tiktok: { available: true, type: 'html-scrape', data: ['name', 'bio', 'followers', 'following', 'likes', 'videos', 'avatar'] },
      reddit: { available: true, type: 'json-api', data: ['name', 'bio', 'followers', 'karma', 'avatar'] },
      facebook: { available: !!process.env.FB_ACCESS_TOKEN, type: 'graph-api', data: ['name', 'bio', 'friends', 'work', 'education'] },
    },
    features: {
      proxy: { supported: true, env: 'SHANDON_PROXY_URL', header: 'x-proxy-url' },
      session: { supported: true, header: 'x-ig-session' },
      monitoring: { available: true, type: 'snapshot-based' },
    },
    auth: process.env.SHANDON_API_KEY ? 'required' : 'optional',
  })
}
