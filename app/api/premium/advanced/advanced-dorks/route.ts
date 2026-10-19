import { NextRequest, NextResponse } from 'next/server'
import { requirePremium } from '@/lib/auth'
import { generateAdvancedDorks } from '@/lib/advanced/advanced-dorks'

export async function POST(request: NextRequest) {
  try {
    const { error } = await requirePremium(request)
    if (error) return error

    const body = await request.json()
    const { target } = body

    if (!target || typeof target !== 'string' || target.trim().length === 0) {
      return NextResponse.json({ error: 'Target is required' }, { status: 400 })
    }

    if (target.length > 100) {
      return NextResponse.json({ error: 'Target too long (max 100 characters)' }, { status: 400 })
    }

    const results = generateAdvancedDorks(target)

    return NextResponse.json({
      success: true,
      target: target.trim(),
      dorkCount: results.length,
      dorks: results
    })
  } catch (error) {
    console.error('Advanced dorks error:', error)
    return NextResponse.json(
      { error: 'Dork generation failed', details: error instanceof Error ? error.message : 'Unknown error' },
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
