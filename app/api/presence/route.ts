import { NextRequest, NextResponse } from 'next/server'
import { runMaigret, checkMaigretAvailable, maigretResultToSearchResult } from '@/lib/maigret'
import { runHttpCheck } from '@/lib/http-checker'
import { runUsernameEnum } from '@/lib/username-enum'
import { validateApiKey, extractApiKeyFromHeaders } from '@/lib/auth-core'
import {
  checkInstaloaderAvailable,
  getInstagramProfile,
  instagramProfileToSearchResult,
} from '@/lib/instaloader'
import { createSnapshot } from '@/lib/snapshot'
import { SearchResult, PresenceAnalysisRequest, ApiResponse } from '@/lib/types'

interface PlatformPresence {
  platform: string
  found: boolean
  url: string
  status: string
  details?: string
  score: number
  source: string
}

interface PresenceReport {
  username: string
  platforms: PlatformPresence[]
  totalFound: number
  totalChecked: number
  presenceScore: number
  topPlatform: string | null
  riskIndicators: string[]
  recommendations: string[]
  scanTimestamp: number
  snapshots_created: string[]
}

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

    const body: PresenceAnalysisRequest = await request.json()
    const { username } = body
    // O Maigret varre ~3000 domínios e leva até 2 minutos. Rodá-lo por padrão
    // transformava a análise de presença em 3 minutos de espera. Fica
    // disponível sob demanda (`deep: true`) para quem quiser varrer fundo.
    const deep = (body as { deep?: boolean }).deep === true

    if (!username || username.trim().length < 2) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Username é obrigatório (mínimo 2 caracteres)',
      }, { status: 400 })
    }

    const cleanUsername = username.replace('@', '').trim().toLowerCase()
    const results: SearchResult[] = []
    const errors: string[] = []

    try {
      const httpResults = await runHttpCheck(cleanUsername)
      results.push(...httpResults)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro HTTP Checker'
      errors.push(`HTTP Checker: ${msg}`)
    }

    // O HTTP Checker cobre 25 plataformas. O enumerador nativo cobre 119 e roda
    // em TypeScript puro, sem depender de Python instalado — que é o que
    // acontece em qualquer ambiente onde o Maigret não está disponível.
    // Sem esta etapa, a análise de presença ficava limitada a 25 sites sempre
    // que o binário faltava.
    try {
      const enumResults = await runUsernameEnum(cleanUsername)
      const known = new Set(results.map((r) => `${r.platform}|${r.url}`))
      for (const r of enumResults) {
        if (!known.has(`${r.platform}|${r.url}`)) results.push(r)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro Username Enum'
      errors.push(`Username Enum: ${msg}`)
    }

    // Maigret (~3000 domínios) e Instaloader (perfis de Instagram) são
    // enriquecimentos caros: entre os dois somam mais de 3 minutos. Ambos ficam
    // atrás de `deep: true`. A varredura padrão usa só os motores nativos
    // (119 plataformas) e responde em segundos.
    const maigretAvailable = deep && (await checkMaigretAvailable().catch(() => false))
    const instaloaderAvailable = deep && (await checkInstaloaderAvailable().catch(() => false))

    if (maigretAvailable) {
      try {
        const maigretResults = await runMaigret(cleanUsername, ['todos'])
        const converted = maigretResults.map((r) =>
          maigretResultToSearchResult(r, cleanUsername)
        )
        results.push(...converted)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erro Maigret'
        errors.push(`Maigret: ${msg}`)
      }
    } else {
      errors.push(
        deep
          ? 'Maigret não disponível neste ambiente'
          : 'Varredura profunda (Maigret) não executada: envie "deep": true para habilitar'
      )
    }

    if (instaloaderAvailable) {
      try {
        const profile = await getInstagramProfile(cleanUsername)
        if (profile) {
          const igResult = instagramProfileToSearchResult(profile)
          const existing = results.find(
            (r) => r.platform === 'Instagram' && r.source === 'maigret'
          )
          if (existing) {
            existing.bio = igResult.bio
            existing.followers = igResult.followers
            existing.following = igResult.following
            existing.posts = igResult.posts
            existing.avatar = igResult.avatar
            existing.extra = { ...existing.extra, ...igResult.extra }
          } else {
            results.push(igResult)
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erro Instaloader'
        errors.push(`Instaloader: ${msg}`)
      }
    }

    const platforms: PlatformPresence[] = results.map((r) => ({
      platform: r.platform,
      found: r.exists === true,
      url: r.url || '',
      status: r.status || (r.exists ? 'found' : 'not_found'),
      details: r.bio || '',
      score: r.score,
      source: r.source,
    }))

    const foundCount = platforms.filter((p) => p.found).length
    const totalChecked = platforms.length
    const presenceScore =
      totalChecked > 0 ? Math.round((foundCount / totalChecked) * 100) : 0

    const sorted = [...platforms]
      .filter((p) => p.found)
      .sort((a, b) => b.score - a.score)
    const topPlatform = sorted.length > 0 ? sorted[0].platform : null

    const riskIndicators: string[] = []
    if (foundCount > 10) {
      riskIndicators.push('Alta exposição: mais de 10 plataformas com o mesmo username')
    }
    if (platforms.some((p) => p.platform === 'LinkedIn' && p.found)) {
      riskIndicators.push('Perfil profissional encontrado — dados de carreira expostos')
    }
    if (platforms.some((p) => p.platform === 'Facebook' && p.found)) {
      riskIndicators.push('Perfil em rede social pessoal — possíveis dados pessoais expostos')
    }
    if (
      platforms.some((p) => p.platform === 'Spotify' && p.found) ||
      platforms.some((p) => p.platform === 'Steam' && p.found)
    ) {
      riskIndicators.push('Presença em plataformas de entretenimento — interesses expostos')
    }
    if (presenceScore > 60) {
      riskIndicators.push('Score de presença alto — username altamente correlacionável')
    }

    const recommendations: string[] = []
    if (presenceScore > 50) {
      recommendations.push('Considere usar usernames diferentes para cada plataforma')
    }
    if (platforms.some((p) => p.platform === 'Email' && p.found)) {
      recommendations.push('E-mail encontrado em serviços — verifique se está exposto em vazamentos')
    }
    if (platforms.some((p) => p.platform === 'LinkedIn' && p.found)) {
      recommendations.push('Revise as informações públicas do perfil LinkedIn')
    }
    if (riskIndicators.length === 0) {
      recommendations.push('Baixa presença online — boa opacidade de identidade')
    }

    const snapshotsCreated: string[] = []

    const igPlatform = platforms.find((p) => p.platform === 'Instagram' && p.found)
    if (igPlatform && instaloaderAvailable) {
      try {
        const igProfile = await getInstagramProfile(cleanUsername)
        if (igProfile) {
          const snap = createSnapshot(
            'instagram',
            cleanUsername,
            {
              username: igProfile.username,
              full_name: igProfile.full_name || null,
              bio: igProfile.biography || null,
              profile_pic_url: igProfile.profile_pic_url || null,
              profile_pic_hash: null,
              followers_count: igProfile.followers ?? null,
              following_count: igProfile.following ?? null,
              posts_count: igProfile.posts ?? null,
              is_verified: igProfile.is_verified ?? null,
              is_private: igProfile.is_private ?? null,
              external_url: igProfile.external_url || null,
              followers_sample: null,
              following_sample: null,
            },
            'instaloader',
            'complete'
          )
          snapshotsCreated.push(`instagram:${snap.id}`)
        }
      } catch {
        // Snapshot de Instagram não é crítico
      }
    }

    const fbPlatform = platforms.find((p) => p.platform === 'Facebook' && p.found)
    if (fbPlatform) {
      const snap = createSnapshot(
        'facebook',
        cleanUsername,
        {
          username: cleanUsername,
          full_name: null,
          bio: fbPlatform.details || null,
          profile_pic_url: null,
          profile_pic_hash: null,
          followers_count: null,
          following_count: null,
          posts_count: null,
          is_verified: null,
          is_private: null,
          external_url: fbPlatform.url || null,
          followers_sample: null,
          following_sample: null,
        },
        'http-checker',
        'partial',
        'Facebook restringe dados via HTTP Checker.'
      )
      snapshotsCreated.push(`facebook:${snap.id}`)
    }

    const report: PresenceReport = {
      username: cleanUsername,
      platforms,
      totalFound: foundCount,
      totalChecked,
      presenceScore,
      topPlatform,
      riskIndicators,
      recommendations,
      scanTimestamp: Date.now(),
      snapshots_created: snapshotsCreated,
    }

    return NextResponse.json<ApiResponse<PresenceReport>>({
      success: true,
      data: report,
    })
  } catch (error) {
    console.error('Presence analysis error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: 'Erro na análise de presença',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  const maigret = await checkMaigretAvailable().catch(() => false)
  const instaloader = await checkInstaloaderAvailable().catch(() => false)

  // O Maigret e o Instaloader são extras opcionais: acrescentam cobertura quando
  // os binários existem. A análise de presença não depende deles — o HTTP
  // Checker (25 plataformas) e o enumerador nativo (119) rodam em TypeScript
  // puro. Reportar `available: false` aqui fazia o site inteiro parecer
  // quebrado quando, na verdade, havia motor funcionando.
  return NextResponse.json({
    available: true,
    engines: {
      httpChecker: true,
      usernameEnum: true,
    },
    optionalEnrichers: {
      maigret,
      instaloader,
    },
    platformsChecked: 119,
    service: 'presence-analysis',
  })
}
