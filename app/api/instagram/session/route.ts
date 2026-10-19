import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/instagram/session
 * Validate and save session cookie
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cookie } = body as { cookie?: string }

    if (!cookie || typeof cookie !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Cookie é obrigatório' },
        { status: 400 }
      )
    }

    // Validate cookie format
    const trimmed = cookie.trim()
    if (trimmed.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Cookie inválido (muito curto)' },
        { status: 400 }
      )
    }

    // Test cookie by fetching current user
    const res = await fetch('https://www.instagram.com/api/v1/accounts/current_user/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        'X-IG-App-ID': '936619743392459',
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': '*/*',
        'Cookie': trimmed,
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: `Erro HTTP ${res.status} - Cookie pode estar expirado` },
        { status: 401 }
      )
    }

    const data = await res.json()

    if (data.status !== 'ok' || !data.user) {
      return NextResponse.json(
        { success: false, error: 'Cookie inválido ou expirado' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        username: data.user.username,
        isValid: true,
      },
    })
  } catch (err) {
    console.error('[api/instagram/session] Error:', err)
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Erro ao validar sessão',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/instagram/session
 * Check if session is valid
 */
export async function GET(request: NextRequest) {
  try {
    const cookie = request.headers.get('x-ig-session-cookie')

    if (!cookie) {
      return NextResponse.json({
        success: true,
        data: { hasSession: false },
      })
    }

    // Validate cookie
    const res = await fetch('https://www.instagram.com/api/v1/accounts/current_user/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        'X-IG-App-ID': '936619743392459',
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': '*/*',
        'Cookie': cookie,
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      return NextResponse.json({
        success: true,
        data: { hasSession: false, isValid: false },
      })
    }

    const data = await res.json()

    return NextResponse.json({
      success: true,
      data: {
        hasSession: true,
        isValid: data.status === 'ok' && !!data.user,
        username: data.user?.username,
      },
    })
  } catch {
    return NextResponse.json({
      success: true,
      data: { hasSession: false, isValid: false },
    })
  }
}
