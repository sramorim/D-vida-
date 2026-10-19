import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import type { ApiResponse } from '@/lib/types'

/**
 * O navegador pergunta se ainda há sessão de admin válida.
 *
 * O token fica em cookie httpOnly, então o cliente não consegue ler. Isso é o
 * ponto: a sessão é a autoridade no servidor, não no sessionStorage do navegador — que
 * qualquer um pode escrever.
 */

const COOKIE_ADMIN = 'shandon_admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_ADMIN)?.value
  if (!token) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Sem sessão de administrador.' },
      { status: 401 }
    )
  }

  const user = await verifyToken(token)
  if (!user) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Sessão expirada. Entre de novo.' },
      { status: 401 }
    )
  }

  return NextResponse.json<ApiResponse<{ email: string }>>({
    success: true,
    data: { email: user.email },
  })
}
