import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, extractApiKeyFromHeaders } from '@/lib/auth-core';
import { lookupWhatsApp } from '@/lib/whatsapp-osint';
import { maskPhone } from '@/lib/redact';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      service: 'whatsapp-lookup',
      description: 'WhatsApp OSINT: foto de perfil, status, negócio, dispositivos, privacidade e dados completos',
      method: 'POST',
      body: { phone: 'string' },
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = extractApiKeyFromHeaders(
      request.headers.get('authorization'),
      request.headers.get('x-api-key'),
      null
    );
    const auth = validateApiKey(apiKey, process.env.SHANDON_API_KEY);
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
    }

    const body = await request.json();
    if (!body.phone || typeof body.phone !== 'string') {
      return NextResponse.json({ success: false, error: 'phone is required' }, { status: 400 });
    }

    const result = await lookupWhatsApp(body.phone);
    // Foto de perfil e dados do dispositivo são pessoais. Sem a máscara, a rota
    // devolvia o pacote inteiro para qualquer um — mesmo sem consentimento.
    // Número sai mascarado; dados agregados como `about` continuam, mas a
    // resposta do `photo` (base64) não é reentregue fora da assinatura PRO.
    if (result && typeof result === 'object') {
      const r = result as { phone?: string; photo?: unknown };
      if (r.phone) r.phone = maskPhone(r.phone);
    }
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}