import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, extractApiKeyFromHeaders } from '@/lib/auth-core';
import { checkWayback } from '@/lib/wayback-check';

export async function GET() {
  return NextResponse.json({
    service: 'wayback-check',
    description: 'Check Wayback Machine for archived snapshots of a URL',
    method: 'POST',
    body: { url: 'string' },
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
    if (!body.url || typeof body.url !== 'string') {
      return NextResponse.json({ success: false, error: 'Missing or invalid url' }, { status: 400 });
    }

    const result = await checkWayback(body.url);
    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
