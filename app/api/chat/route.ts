import { NextResponse } from 'next/server'
import { getResponse } from '@/lib/chatbot/responder'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { message, context } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Mensagem é obrigatória' },
        { status: 400 }
      )
    }

    const trimmed = message.trim()
    if (trimmed.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Mensagem não pode estar vazia' },
        { status: 400 }
      )
    }

    if (trimmed.length > 500) {
      return NextResponse.json(
        { success: false, error: 'Mensagem muito longa (máximo 500 caracteres)' },
        { status: 400 }
      )
    }

    const response = getResponse(trimmed, context)

    return NextResponse.json({
      success: true,
      data: {
        response,
        timestamp: Date.now(),
      },
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
