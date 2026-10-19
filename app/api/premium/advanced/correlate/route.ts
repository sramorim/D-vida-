import { NextRequest, NextResponse } from 'next/server'
import { requirePremium } from '@/lib/auth'
import { correlateData } from '@/lib/advanced/correlation-engine'

export async function POST(request: NextRequest) {
  try {
    const { error } = await requirePremium(request)
    if (error) return error

    const body = await request.json()
    const { data } = body

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: 'Data array is required', details: 'Provide at least one data point' },
        { status: 400 }
      )
    }

    if (data.length > 50) {
      return NextResponse.json({ error: 'Maximum 50 data points allowed' }, { status: 400 })
    }

    const invalidItems = data.filter(
      item => typeof item !== 'object' || item === null
    )

    if (invalidItems.length > 0) {
      return NextResponse.json(
        { error: 'Invalid data items detected', details: 'Each item must be an object' },
        { status: 400 }
      )
    }

    const result = await correlateData(data)

    return NextResponse.json({
      success: true,
      result
    })
  } catch (error) {
    console.error('Correlation error:', error)
    return NextResponse.json(
      { error: 'Correlation analysis failed', details: error instanceof Error ? error.message : 'Unknown error' },
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
