import { NextRequest, NextResponse } from 'next/server'
import {
  checkInstaloaderAvailable,
} from '@/lib/instaloader'
import { validateApiKey, extractApiKeyFromHeaders } from '@/lib/auth-core'
import type { InteractionsData, InteractionProfile, SnapshotPlatform, ApiResponse } from '@/lib/types'

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
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '7', 10), 7)

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
      const data: InteractionsData = {
        platform: 'instagram',
        target_username: cleanUsername,
        profiles: [],
        total_posts_analyzed: 0,
        status: 'insufficient_data',
        message: 'Instaloader não disponível. Dados de curtidas/comentários requerem o provider.',
      }
      return NextResponse.json<ApiResponse<InteractionsData>>({ success: true, data })
    }

    const data: InteractionsData = {
      platform: 'instagram',
      target_username: cleanUsername,
      profiles: [],
      total_posts_analyzed: 0,
      status: 'insufficient_data',
      message: 'Análise de interações requer acesso a posts e comentários. Provider disponível mas dados de posts não coletados no snapshot atual.',
    }
    return NextResponse.json<ApiResponse<InteractionsData>>({ success: true, data })
  }

  if (platform === 'facebook') {
    const data: InteractionsData = {
      platform: 'facebook',
      target_username: cleanUsername,
      profiles: [],
      total_posts_analyzed: 0,
      status: 'unavailable',
      message: 'Facebook não fornece dados de interação (curtidas/comentários) via HTTP Checker.',
    }
    return NextResponse.json<ApiResponse<InteractionsData>>({ success: true, data })
  }

  return NextResponse.json<ApiResponse<null>>({
    success: false,
    error: 'Plataforma não suportada',
  }, { status: 400 })
}
