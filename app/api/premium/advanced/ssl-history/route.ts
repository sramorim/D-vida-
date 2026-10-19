import { NextRequest, NextResponse } from 'next/server'
import { requirePremium } from '@/lib/auth'
import { checkSslHistory } from '@/lib/advanced/ssl-history'

export async function POST(request: NextRequest) {
  try {
    const { error } = await requirePremium(request)
    if (error) return error

    const body = await request.json()
    const { domain } = body

    if (!domain || typeof domain !== 'string') {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 })
    }

    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '')

    if (!domainRegex.test(cleanDomain)) {
      return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 })
    }

    const result = await checkSslHistory(cleanDomain)

    return NextResponse.json({
      success: true,
      result
    })
  } catch (error) {
    console.error('SSL history error:', error)
    return NextResponse.json(
      { error: 'SSL history check failed', details: error instanceof Error ? error.message : 'Unknown error' },
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
