import { NextRequest, NextResponse } from 'next/server'
import { defaultLimiter } from '@/lib/rate-limit-core'
import { verifyToken } from '@/lib/auth'

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp
  return 'unknown'
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Painel administrativo. A página /admin é servida normalmente — quem decide
  // o que pintar nela é ShAdminPanel, que pergunta a /api/admin/session e cai
  // no formulário quando o cookie não vale. O que o middleware trava são as
  // rotas de dados.
  if (pathname.startsWith('/api/admin')) {
    // verify e logout precisam ser públicos: são eles que abrem e fecham a
    // sessão. Todo o resto exige cookie de admin válido.
    const publicAdmin = pathname === '/api/admin/verify' || pathname === '/api/admin/logout'
    if (!publicAdmin) {
      const adminToken = request.cookies.get('shandon_admin')?.value
      const payload = adminToken ? await verifyToken(adminToken) : null
      if (!payload) {
        return NextResponse.json(
          { success: false, error: 'Acesso restrito ao administrador.' },
          { status: 401 }
        )
      }
    }
  }

  if (pathname.startsWith('/premium') || pathname.startsWith('/api/premium')) {
    const token = request.cookies.get('shandon-auth-token')?.value
    if (!token) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })
      }
      return NextResponse.redirect(new URL('/login', request.url))
    }
    const payload = await verifyToken(token)
    if (!payload) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ success: false, error: 'Token inválido' }, { status: 401 })
      }
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  const response = NextResponse.next()

  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  if (pathname.startsWith('/api/')) {
    if (request.method === 'OPTIONS') {
      return NextResponse.next()
    }

    const ip = getClientIp(request)
    const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10)
    const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '30', 10)

    const rateResult = defaultLimiter.check(ip, { windowMs, maxRequests })

    if (!rateResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit excedido. Aguarde antes de tentar novamente.',
        },
        {
          status: 429,
          headers: defaultLimiter.getHeaders(rateResult, maxRequests),
        }
      )
    }

    const rateHeaders = defaultLimiter.getHeaders(rateResult, maxRequests)
    for (const [key, value] of Object.entries(rateHeaders)) {
      response.headers.set(key, value)
    }

    const allowedOrigin = process.env.ALLOWED_ORIGIN || 'https://elite.senhoramorim.com.br'
    response.headers.set('Access-Control-Allow-Origin', allowedOrigin)
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key')
    response.headers.set('Access-Control-Max-Age', '86400')

    return response
  }

  return response
}

export const config = {
  matcher: ['/api/:path*', '/premium/:path*', '/admin'],
}
