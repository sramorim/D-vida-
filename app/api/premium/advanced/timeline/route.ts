import { NextRequest, NextResponse } from 'next/server'
import { requirePremium } from '@/lib/auth'
import { buildTimeline } from '@/lib/advanced/timeline-builder'

export async function POST(request: NextRequest) {
  try {
    const { error } = await requirePremium(request)
    if (error) return error

    const body = await request.json()
    const username = body.username || body.target

    if (!username || typeof username !== 'string' || username.trim().length === 0) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    if (username.length > 50) {
      return NextResponse.json({ error: 'Username too long (max 50 characters)' }, { status: 400 })
    }

    const result = await buildTimeline(username)

    return NextResponse.json({
      success: true,
      username: username.trim(),
      eventCount: result.length,
      events: result
    })
  } catch (error) {
    console.error('Timeline builder error:', error)
    return NextResponse.json(
      { error: 'Timeline building failed', details: error instanceof Error ? error.message : 'Unknown error' },
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
