import { NextRequest, NextResponse } from 'next/server'
import { getSnapshots, compareSnapshots } from '@/lib/snapshot'
import { validateApiKey, extractApiKeyFromHeaders } from '@/lib/auth-core'
import type { SnapshotPlatform, ApiResponse, SnapshotComparison } from '@/lib/types'

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
  const days = parseInt(url.searchParams.get('days') || '30', 10)

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
  const snapshots = getSnapshots(platform, cleanUsername)

  if (snapshots.length === 0) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Nenhum snapshot encontrado',
      details: `Crie um snapshot primeiro usando POST /api/snapshot para @${cleanUsername}`,
    }, { status: 404 })
  }

  if (snapshots.length === 1) {
    return NextResponse.json<ApiResponse<{ message: string; snapshot: typeof snapshots[0] }>>({
      success: true,
      data: {
        message: 'Primeiro snapshot salvo. Uma comparação estará disponível quando houver uma nova captura.',
        snapshot: snapshots[0],
      },
    })
  }

  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  const recentSnapshots = snapshots.filter((s) => s.timestamp >= cutoff)

  if (recentSnapshots.length < 2) {
    return NextResponse.json<ApiResponse<{ message: string; total: number; recent: number }>>({
      success: true,
      data: {
        message: `Apenas ${recentSnapshots.length} snapshot(s) encontrado(s) nos últimos ${days} dias. Amplie o período ou crie um novo snapshot.`,
        total: snapshots.length,
        recent: recentSnapshots.length,
      },
    })
  }

  const after = recentSnapshots[0]
  const before = recentSnapshots[1]

  const comparison = compareSnapshots(before, after)

  return NextResponse.json<ApiResponse<SnapshotComparison>>({
    success: true,
    data: comparison,
  })
}
