import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, extractApiKeyFromHeaders } from '@/lib/auth-core';
import { reconDomain } from '@/lib/domain-intel';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      service: 'domain-intel',
      description: 'Domain reconnaissance and intelligence',
      method: 'POST',
      body: { domain: 'string' },
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
    if (!body.domain) {
      return NextResponse.json({ success: false, error: 'domain is required' }, { status: 400 });
    }

    const result = await reconDomain(body.domain);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
