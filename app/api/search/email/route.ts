import { NextRequest, NextResponse } from 'next/server'
import { runHolehe, checkHoleheAvailable, holeheResultToSearchResult } from '@/lib/holehe'
import { validateApiKey, extractApiKeyFromHeaders } from '@/lib/auth-core'
import { EmailSearchRequest, SearchResult, ApiResponse } from '@/lib/types'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

    const body: EmailSearchRequest = await request.json()
    const { email } = body

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'E-mail inválido',
      }, { status: 400 })
    }

    const available = await checkHoleheAvailable()
    
    if (!available) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Holehe não está instalado ou não está disponível',
        details: 'Execute: pip3 install holehe',
      }, { status: 503 })
    }

    const holeheResults = await runHolehe(email)
    
    const results: SearchResult[] = holeheResults.map(r => holeheResultToSearchResult(r))
    
    const foundResults = results.filter(r => r.exists)
    const notFoundResults = results.filter(r => !r.exists && r.status !== 'rate_limited')
    const rateLimitedResults = results.filter(r => r.status === 'rate_limited')

    return NextResponse.json<ApiResponse<SearchResult[]>>({
      success: true,
      data: results,
    }, {
      headers: {
        'X-Total-Results': results.length.toString(),
        'X-Found-Results': foundResults.length.toString(),
        'X-Not-Found-Results': notFoundResults.length.toString(),
        'X-Rate-Limited-Results': rateLimitedResults.length.toString(),
      }
    })
  } catch (error) {
    console.error('Email search error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    
    if (errorMessage.includes('timeout') || errorMessage.includes('TIMEOUT')) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Timeout na busca',
        details: 'A busca demorou mais que o esperado. Tente novamente.',
      }, { status: 408 })
    }
    
    if (errorMessage.includes('rate limit') || errorMessage.includes('RATE LIMIT')) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Rate limit excedido',
        details: 'Muitas requisições. Aguarde antes de tentar novamente.',
      }, { status: 429 })
    }

    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Erro na busca',
      details: errorMessage,
    }, { status: 500 })
  }
}

export async function GET() {
  const available = await checkHoleheAvailable()
  
  return NextResponse.json({
    available,
    service: 'holehe',
    auth: process.env.SHANDON_API_KEY ? 'required' : 'optional',
  })
}