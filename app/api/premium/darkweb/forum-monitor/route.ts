import { NextRequest, NextResponse } from 'next/server'
import { requirePremium } from '@/lib/auth'
import { monitorForums } from '@/lib/darkweb/forum-monitor'

export async function POST(request: NextRequest) {
  try {
    const { error } = await requirePremium(request)
    if (error) return error

    const body = await request.json()
    const { query } = body

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
    }

    if (query.length > 200) {
      return NextResponse.json({ error: 'Query too long (max 200 characters)' }, { status: 400 })
    }

    const results = await monitorForums(query)

    return NextResponse.json({
      success: true,
      query: query.trim(),
      resultCount: results.length,
      results
    })
  } catch (error) {
    console.error('Forum monitor error:', error)
    return NextResponse.json(
      { error: 'Forum monitoring failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  )
}
