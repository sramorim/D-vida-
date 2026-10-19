import { NextRequest, NextResponse } from 'next/server'
import { requirePremium } from '@/lib/auth'
import { checkWaybackPro } from '@/lib/advanced/wayback-pro'

export async function POST(request: NextRequest) {
  try {
    const { error } = await requirePremium(request)
    if (error) return error

    const body = await request.json()
    const { url } = body

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    const result = await checkWaybackPro(url)

    return NextResponse.json({
      success: true,
      result
    })
  } catch (error) {
    console.error('Wayback Pro error:', error)
    return NextResponse.json(
      { error: 'Wayback Machine check failed', details: error instanceof Error ? error.message : 'Unknown error' },
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
