import { NextRequest, NextResponse } from 'next/server'
import { requirePremium } from '@/lib/auth'
import { bulkScan } from '@/lib/advanced/bulk-scanner'

export async function POST(request: NextRequest) {
  try {
    const { error } = await requirePremium(request)
    if (error) return error

    const body = await request.json()
    const { usernames } = body

    if (!usernames || !Array.isArray(usernames) || usernames.length === 0) {
      return NextResponse.json(
        { error: 'At least one username is required', details: 'Provide a usernames array' },
        { status: 400 }
      )
    }

    if (usernames.length > 20) {
      return NextResponse.json({ error: 'Maximum 20 usernames per scan' }, { status: 400 })
    }

    const invalidUsernames = usernames.filter(
      u => typeof u !== 'string' || u.trim().length === 0 || u.length > 30
    )

    if (invalidUsernames.length > 0) {
      return NextResponse.json(
        { error: 'Invalid usernames detected', details: 'Usernames must be 1-30 characters' },
        { status: 400 }
      )
    }

    const results = await bulkScan(usernames)

    return NextResponse.json({
      success: true,
      scanCount: usernames.length,
      totalResults: results.length,
      results
    })
  } catch (error) {
    console.error('Bulk scan error:', error)
    return NextResponse.json(
      { error: 'Bulk scan failed', details: error instanceof Error ? error.message : 'Unknown error' },
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
