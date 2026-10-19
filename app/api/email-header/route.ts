import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, extractApiKeyFromHeaders } from '@/lib/auth-core';
import { analyzeEmailHeader } from '@/lib/email-header';

export async function GET() {
  return NextResponse.json({
    service: 'email-header',
    description: 'Analyze raw email headers for tracing and metadata',
    method: 'POST',
    body: { header: 'string' },
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
    if (!body.header || typeof body.header !== 'string') {
      return NextResponse.json({ success: false, error: 'Missing or invalid header' }, { status: 400 });
    }

    const result = await analyzeEmailHeader(body.header);
    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
