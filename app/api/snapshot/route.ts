import { NextRequest, NextResponse } from 'next/server'
import { getSnapshots, getLatestSnapshot, createSnapshot, getTimeline } from '@/lib/snapshot'
import type { Snapshot, SnapshotPlatform, ApiResponse } from '@/lib/types'
import { checkInstaloaderAvailable, getInstagramProfile } from '@/lib/instaloader'
import { runHttpCheck } from '@/lib/http-checker'
import { validateApiKey, extractApiKeyFromHeaders } from '@/lib/auth-core'

function checkAuth(request: NextRequest): NextResponse | null {
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
  return null
}

interface SnapshotRequest {
  platform: SnapshotPlatform
  username: string
}

export async function POST(request: NextRequest) {
  try {
    const authError = checkAuth(request)
    if (authError) return authError

    const body: SnapshotRequest = await request.json()
    const { platform, username } = body

    if (!username || username.trim().length < 2) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Username é obrigatório (mínimo 2 caracteres)',
      }, { status: 400 })
    }

    const cleanUsername = username.replace('@', '').trim().toLowerCase()

    if (platform === 'instagram') {
      const available = await checkInstaloaderAvailable().catch(() => false)

      if (!available) {
        const httpResults = await runHttpCheck(cleanUsername)
        const igResult = httpResults.find(
          (r) => r.platform.toLowerCase() === 'instagram' && r.exists
        )

        if (!igResult) {
          return NextResponse.json<ApiResponse<null>>({
            success: false,
            error: 'Perfil Instagram não encontrado ou provider indisponível',
            details: 'Instaloader não disponível. Execute: pip3 install instaloader',
          }, { status: 404 })
        }

        const snapshot = createSnapshot(
          'instagram',
          cleanUsername,
          {
            username: cleanUsername,
            full_name: igResult.displayName || null,
            bio: igResult.bio || null,
            profile_pic_url: igResult.avatar || null,
            profile_pic_hash: null,
            followers_count: igResult.followers ? parseCount(igResult.followers) : null,
            following_count: igResult.following ? parseCount(igResult.following) : null,
            posts_count: igResult.posts ? parseCount(igResult.posts) : null,
            is_verified: null,
            is_private: null,
            external_url: igResult.url || null,
            followers_sample: null,
            following_sample: null,
          },
          'http-checker',
          'partial',
          'Instaloader indisponível. Dados parciais via HTTP Checker.'
        )

        return NextResponse.json<ApiResponse<Snapshot>>({
          success: true,
          data: snapshot,
        })
      }

      const profile = await getInstagramProfile(cleanUsername)
      if (!profile) {
        return NextResponse.json<ApiResponse<null>>({
          success: false,
          error: 'Perfil não encontrado',
          details: `O perfil @${cleanUsername} não existe ou é privado`,
        }, { status: 404 })
      }

      const snapshot = createSnapshot(
        'instagram',
        cleanUsername,
        {
          username: profile.username,
          full_name: profile.full_name || null,
          bio: profile.biography || null,
          profile_pic_url: profile.profile_pic_url || null,
          profile_pic_hash: null,
          followers_count: profile.followers ?? null,
          following_count: profile.following ?? null,
          posts_count: profile.posts ?? null,
          is_verified: profile.is_verified ?? null,
          is_private: profile.is_private ?? null,
          external_url: profile.external_url || null,
          followers_sample: null,
          following_sample: null,
        },
        'instaloader',
        'complete'
      )

      return NextResponse.json<ApiResponse<Snapshot>>({
        success: true,
        data: snapshot,
      })
    }

    if (platform === 'facebook') {
      const httpResults = await runHttpCheck(cleanUsername)
      const fbResult = httpResults.find(
        (r) => r.platform.toLowerCase() === 'facebook' && r.exists
      )

      const snapshot = createSnapshot(
        'facebook',
        cleanUsername,
        {
          username: cleanUsername,
          full_name: fbResult?.displayName || null,
          bio: fbResult?.bio || null,
          profile_pic_url: null,
          profile_pic_hash: null,
          followers_count: null,
          following_count: null,
          posts_count: null,
          is_verified: null,
          is_private: null,
          external_url: fbResult?.url || null,
          followers_sample: null,
          following_sample: null,
        },
        'http-checker',
        fbResult ? 'partial' : 'partial',
        fbResult ? 'Dados limitados via HTTP Checker. Facebook restringe scraping.' : 'Perfil não encontrado via HTTP Checker.'
      )

      return NextResponse.json<ApiResponse<Snapshot>>({
        success: true,
        data: snapshot,
      })
    }

    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: `Plataforma "${platform}" não suportada para snapshots`,
      details: 'Plataformas suportadas: instagram, facebook',
    }, { status: 400 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Erro ao criar snapshot',
      details: msg,
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const authError = checkAuth(request)
  if (authError) return authError

  const url = new URL(request.url)
  const platform = url.searchParams.get('platform') as SnapshotPlatform | null
  const username = url.searchParams.get('username')
  const action = url.searchParams.get('action') || 'list'

  if (!platform || !username) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Parâmetros platform e username são obrigatórios',
    }, { status: 400 })
  }

  if (platform !== 'instagram' && platform !== 'facebook') {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Plataforma deve ser "instagram" ou "facebook"',
    }, { status: 400 })
  }

  const cleanUsername = username.replace('@', '').trim().toLowerCase()

  if (action === 'timeline') {
    const timeline = getTimeline(platform, cleanUsername)
    return NextResponse.json<ApiResponse<Snapshot[]>>({
      success: true,
      data: timeline,
    })
  }

  if (action === 'latest') {
    const latest = getLatestSnapshot(platform, cleanUsername)
    return NextResponse.json<ApiResponse<Snapshot | null>>({
      success: true,
      data: latest,
    })
  }

  const snapshots = getSnapshots(platform, cleanUsername)
  return NextResponse.json<ApiResponse<Snapshot[]>>({
    success: true,
    data: snapshots,
  })
}

function parseCount(value: string): number | null {
  if (!value) return null
  const cleaned = value.replace(/[^0-9.KMBkmb]/g, '')
  const multipliers: Record<string, number> = {
    K: 1000, k: 1000,
    M: 1000000, m: 1000000,
    B: 1000000000, b: 1000000000,
  }
  for (const [suffix, mult] of Object.entries(multipliers)) {
    if (cleaned.endsWith(suffix)) {
      return Math.round(parseFloat(cleaned.replace(suffix, '')) * mult)
    }
  }
  return parseInt(cleaned, 10) || null
}
