import { NextRequest, NextResponse } from 'next/server'
import {
  checkInstaloaderAvailable,
  getInstagramFollowers,
  getInstagramFollowing,
} from '@/lib/instaloader'
import { runHttpCheck } from '@/lib/http-checker'
import { validateApiKey, extractApiKeyFromHeaders } from '@/lib/auth-core'
import type { FollowersData, FollowerProfile, SnapshotPlatform, ApiResponse } from '@/lib/types'

export async function GET(request: NextRequest) {
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

  const url = new URL(request.url)
  const platform = url.searchParams.get('platform') as SnapshotPlatform | null
  const username = url.searchParams.get('username')
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '30', 10), 30)

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

  if (platform === 'instagram') {
    const available = await checkInstaloaderAvailable().catch(() => false)

    if (!available) {
      // Lista nominal de seguidores exige sessão autenticada no Instagram: a
      // via anônima não devolve essa informação. Dizer isto com clareza é
      // melhor que devolver `success: true` com lista vazia, que o usuário
      // lia como "não tenho seguidores".
      const data: FollowersData = {
        platform: 'instagram',
        target_username: cleanUsername,
        followers: [],
        following_list: [],
        total_returned: 0,
        has_temporal_order: false,
        status: 'unavailable',
        message:
          'Listar seguidores exige autenticação no Instagram (sessão ou token). ' +
          'Use a busca pública de perfil em /api/instagram/public para seguidores totais. ' +
          'O ambiente atual não tem credencial de sessão configurada.',
      }
      return NextResponse.json<ApiResponse<FollowersData>>({ success: true, data })
    }

    try {
      const [followersResults, followingResults] = await Promise.all([
        getInstagramFollowers(cleanUsername),
        getInstagramFollowing(cleanUsername).catch(() => []),
      ])

      const followingSet = new Set(followingResults.map((f) => f.username.toLowerCase()))

      const limitedFollowers = followersResults.slice(0, limit)

      const followers: FollowerProfile[] = limitedFollowers.map((f) => ({
        username: f.username,
        full_name: f.displayName || null,
        profile_pic_url: f.avatar || null,
        url: f.url || `https://www.instagram.com/${f.username}`,
        follows_target: null,
      }))

      const followingList = followingResults.map((f) => f.username)

      const data: FollowersData = {
        platform: 'instagram',
        target_username: cleanUsername,
        followers,
        following_list: followingList,
        total_returned: followersResults.length,
        has_temporal_order: false,
        status: 'complete',
      }

      return NextResponse.json<ApiResponse<FollowersData>>({ success: true, data })
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido'
      const data: FollowersData = {
        platform: 'instagram',
        target_username: cleanUsername,
        followers: [],
        following_list: [],
        total_returned: 0,
        has_temporal_order: false,
        status: 'unavailable',
        message: msg,
      }
      return NextResponse.json<ApiResponse<FollowersData>>({ success: true, data })
    }
  }

  if (platform === 'facebook') {
    const data: FollowersData = {
      platform: 'facebook',
      target_username: cleanUsername,
      followers: [],
      following_list: [],
      total_returned: 0,
      has_temporal_order: false,
      status: 'unavailable',
      message: 'Facebook não fornece lista de seguidores via HTTP Checker.',
    }
    return NextResponse.json<ApiResponse<FollowersData>>({ success: true, data })
  }

  return NextResponse.json<ApiResponse<null>>({
    success: false,
    error: 'Plataforma não suportada',
  }, { status: 400 })
}
