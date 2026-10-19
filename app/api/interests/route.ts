import { NextRequest, NextResponse } from 'next/server'
import type { SnapshotPlatform, ApiResponse, InterestData } from '@/lib/types'
import { getSnapshots, getLatestSnapshot } from '@/lib/snapshot'
import { validateApiKey, extractApiKeyFromHeaders } from '@/lib/auth-core'

interface PostSample {
  caption?: string
  hashtags?: string[]
  timestamp?: string
  likes?: number
  comments?: number
  tagged_users?: string[]
}

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
  const latest = getLatestSnapshot(platform, cleanUsername)

  if (!latest) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Nenhum snapshot encontrado',
      details: `Crie um snapshot primeiro usando POST /api/snapshot para @${cleanUsername}`,
    }, { status: 404 })
  }

  const allSnapshots = getSnapshots(platform, cleanUsername)

  const data: InterestData = {
    platform,
    username: cleanUsername,
    hashtags: [],
    post_times: [],
    total_posts_analyzed: 0,
    avg_engagement: null,
    top_interactions: [],
    status: 'insufficient_data',
    message: 'Análise de interesses requer dados de posts que não estão disponíveis no snapshot atual.',
  }

  const bio = latest.profile.bio
  if (bio) {
    const bioHashtags = bio.match(/#\w+/g) || []
    const tagCounts = new Map<string, number>()
    for (const tag of bioHashtags) {
      tagCounts.set(tag.toLowerCase(), (tagCounts.get(tag.toLowerCase()) || 0) + 1)
    }
    data.hashtags = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
  }

  if (allSnapshots.length >= 2) {
    const timestamps = allSnapshots.map((s) => new Date(s.timestamp))
    const hours = timestamps.map((d) => d.getHours())
    const hourCounts = new Map<number, number>()
    for (const h of hours) {
      hourCounts.set(h, (hourCounts.get(h) || 0) + 1)
    }
    data.post_times = Array.from(hourCounts.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
  }

  if (data.hashtags.length > 0 || data.post_times.length > 0) {
    data.status = 'partial'
    data.message = 'Dados parciais extraídos do bio e timestamps dos snapshots.'
  }

  return NextResponse.json<ApiResponse<InterestData>>({
    success: true,
    data,
  })
}
