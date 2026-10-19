import { NextRequest, NextResponse } from 'next/server'
import { fetchPublicProfile } from '@/lib/instagram/public'
import type { ApiResponse } from '@/lib/types'
import type { InstagramPublicProfile } from '@/lib/instagram/public'

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get('username')

  if (!username || username.trim().length === 0) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Parâmetro "username" é obrigatório' },
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

    try {
    const profile = await fetchPublicProfile(cleanUsername)

    if (!profile) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'Perfil não encontrado',
          details: `O perfil @${cleanUsername} não existe ou não está acessível`,
        },
        { status: 404 }
      )
    }

    return NextResponse.json<ApiResponse<InstagramPublicProfile>>({
      success: true,
      data: profile,
    })
  } catch (error) {
    console.error('[api/instagram/public] Error:', error)
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: 'Erro ao buscar perfil público',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}
