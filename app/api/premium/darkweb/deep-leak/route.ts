import { NextRequest, NextResponse } from 'next/server'
import { requirePremium } from '@/lib/auth'
import { checkDeepLeak } from '@/lib/darkweb/deep-leak'

export async function POST(request: NextRequest) {
  try {
    const { error } = await requirePremium(request)
    if (error) return error

    const body = await request.json()
    const email = body.email || body.query

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    const result = await checkDeepLeak(email)

    return NextResponse.json({
      success: true,
      result
    })
  } catch (error) {
    console.error('Deep leak check error:', error)
    return NextResponse.json(
      { error: 'Deep leak check failed', details: error instanceof Error ? error.message : 'Unknown error' },
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
