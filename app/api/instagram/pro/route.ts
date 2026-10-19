import { NextRequest, NextResponse } from 'next/server'
import { fetchAuthenticatedProfile } from '@/lib/instagram/authenticated'
import type { ApiResponse } from '@/lib/types'
import type { InstagramAuthenticatedProfile } from '@/lib/instagram/authenticated'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, sessionCookie } = body

    if (!username || !sessionCookie) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Username e sessionCookie são obrigatórios' },
        { status: 400 }
      )
    }

    const cleanUsername = username.replace('@', '').trim()

    if (cleanUsername.length > 30 || !/^[a-zA-Z0-9._]+$/.test(cleanUsername)) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Username inválido' },
        { status: 400 }
      )
    }

    const profile = await fetchAuthenticatedProfile(cleanUsername, sessionCookie)

    if (!profile) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'Não foi possível buscar dados autenticados',
          details: `Verifique o sessionCookie ou se o perfil @${cleanUsername} existe`,
        },
        { status: 404 }
      )
    }

    return NextResponse.json<ApiResponse<InstagramAuthenticatedProfile>>({
      success: true,
      data: profile,
    })
  } catch (error) {
    console.error('[api/instagram/pro] Error:', error)
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: 'Erro ao buscar dados autenticados',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    info: 'Endpoint para dados autenticados do Instagram',
    usage: 'POST com { username, sessionCookie }',
    sessionCookie: 'Obtido via POST /api/instagram/auth',
  })
}
