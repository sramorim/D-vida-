import { NextResponse } from 'next/server'

/**
 * Logout do painel administrativo. O cookie é httpOnly, então só o servidor
 * pode limpá-lo — é por isso que o botão "Sair" precisa vir até aqui.
 */

const COOKIE_ADMIN = 'shandon_admin'

export async function POST() {
  const res = NextResponse.json({ success: true })
  res.cookies.set(COOKIE_ADMIN, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  })
  return res
}
