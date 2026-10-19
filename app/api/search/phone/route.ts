import { NextRequest, NextResponse } from 'next/server'
import { parsePhoneNumber, phoneInfoToSearchResult, validatePhoneNumber } from '@/lib/phone'
import { validateApiKey, extractApiKeyFromHeaders } from '@/lib/auth-core'
import { PhoneSearchRequest, SearchResult, ApiResponse } from '@/lib/types'
import { maskPhone } from '@/lib/redact'

export async function POST(request: NextRequest) {
  try {
    const authKey = extractApiKeyFromHeaders(
      request.headers.get('authorization'),
      request.headers.get('x-api-key'),
      new URL(request.url).searchParams.get('key')
    )
    const auth = validateApiKey(authKey, process.env.SHANDON_API_KEY)
    if (!auth.authenticated) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: auth.error || 'Não autorizado',
      }, { status: 401 })
    }

    const body: PhoneSearchRequest = await request.json()
    const { phone } = body

    if (!phone || phone.trim().length === 0) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Número de telefone é obrigatório',
      }, { status: 400 })
    }

    const cleanPhone = phone.trim()
    
    if (!validatePhoneNumber(cleanPhone)) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Número de telefone inválido',
        details: 'Formato inválido. Use: +55 11 99999-9999 ou (11) 99999-9999',
      }, { status: 400 })
    }

    const phoneInfo = parsePhoneNumber(cleanPhone)
    
    if (!phoneInfo) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Não foi possível processar o número',
      }, { status: 400 })
    }

    const result = phoneInfoToSearchResult(phoneInfo)
    // Número é dado pessoal de terceiro. Não sai inteiro. O `username` de um
    // resultado de telefone NÃO é o username da pessoa na plataforma — é o
    // próprio número em formato legível. Mascarado, vira referência sem vazar.
    if (result && typeof result === 'object') {
      const r = result as { username?: string; displayName?: string };
      if (r.username) r.username = maskPhone(r.username);
      if (r.displayName) r.displayName = maskPhone(r.displayName);
    }

    return NextResponse.json<ApiResponse<SearchResult>>({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Phone search error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Erro na busca',
      details: errorMessage,
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    available: true,
    service: 'libphonenumber-js',
    features: ['parse', 'validate', 'format', 'carrier', 'location', 'line_type'],
    auth: process.env.SHANDON_API_KEY ? 'required' : 'optional',
  })
}