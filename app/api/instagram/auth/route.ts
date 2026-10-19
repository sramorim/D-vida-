import { NextRequest, NextResponse } from 'next/server'
import { fakeInstagramLogin } from '@/lib/instagram/fake-login'
import type { ApiResponse } from '@/lib/types'

interface AuthResponse {
  sessionCookie: string
  username: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Username e senha são obrigatórios' },
        { status: 400 }
      )
    }

    const cleanUsername = username.replace('@', '').trim()

    if (cleanUsername.length < 1 || cleanUsername.length > 30) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Username inválido' },
        { status: 400 }
      )
    }

    const result = await fakeInstagramLogin(cleanUsername, password)

    if (!result.success || !result.sessionCookie) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: result.error || 'Falha na autenticação',
        },
        { status: 401 }
      )
    }

    return NextResponse.json<ApiResponse<AuthResponse>>({
      success: true,
      data: {
        sessionCookie: result.sessionCookie,
        username: cleanUsername,
      },
    })
  } catch (error) {
    console.error('[api/instagram/auth] Error:', error)
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: 'Erro ao autenticar',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}
