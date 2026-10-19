import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, extractApiKeyFromHeaders } from '@/lib/auth-core';
import { trackSSL } from '@/lib/ssl-tracker';

export async function GET() {
  return NextResponse.json({
    service: 'ssl-tracker',
    description: 'Track and analyze SSL/TLS certificates for a domain',
    method: 'POST',
    body: { domain: 'string' },
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
    if (!body.domain || typeof body.domain !== 'string') {
      return NextResponse.json({ success: false, error: 'Missing or invalid domain' }, { status: 400 });
    }

    const result = await trackSSL(body.domain);
    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
