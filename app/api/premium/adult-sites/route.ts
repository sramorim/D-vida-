import { NextRequest, NextResponse } from 'next/server'
import { requirePremium } from '@/lib/auth'
import { checkAdultSites } from '@/lib/adult-sites/checker'

export async function POST(request: NextRequest) {
  try {
    const { error } = await requirePremium(request)
    if (error) return error

    const body = await request.json()
    const { username } = body

    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    if (username.length < 2 || username.length > 64) {
      return NextResponse.json(
        { error: 'Username must be between 2 and 64 characters' },
        { status: 400 }
      )
    }

    const usernameRegex = /^[a-zA-Z0-9._-]+$/
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { error: 'Invalid username format' },
        { status: 400 }
      )
    }

    const results = await checkAdultSites(username)

    const found = results.filter((r) => r.found).length
    const total = results.length

    return NextResponse.json({
      success: true,
      username,
      found,
      total,
      results,
    })
  } catch (error) {
    console.error('Adult sites check error:', error)
    return NextResponse.json(
      {
        error: 'Adult sites check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
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
