import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, extractApiKeyFromHeaders } from '@/lib/auth-core';
import { analyzePhone } from '@/lib/phone-osint';
import { maskPhone } from '@/lib/redact';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      service: 'phone-osint',
      description: 'Phone number OSINT and intelligence gathering',
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
    if (!body.phone) {
      return NextResponse.json({ success: false, error: 'phone is required' }, { status: 400 });
    }

    const result = await analyzePhone(body.phone);
    // Dado pessoal de terceiro: número inteiro NUNCA sai na resposta pública.
    // Mesmo autenticado com a chave geral, mascaramos - a chave geral não é
    // evidência de consentimento para reexpor o número.
    if (result && typeof result === 'object') {
      const r = result as { username?: string; displayName?: string; extra?: { whatsapp?: boolean } };
      if (r.username) r.username = maskPhone(r.username);
      if (r.displayName) r.displayName = maskPhone(r.displayName);
    }
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
