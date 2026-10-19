import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, extractApiKeyFromHeaders } from '@/lib/auth-core';
import { runUsernameEnum } from '@/lib/username-enum';

export async function GET() {
  return NextResponse.json({
    service: 'username-enum',
    description: 'Enumerate usernames across multiple platforms',
    method: 'POST',
    body: { username: 'string' },
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
    if (!body.username || typeof body.username !== 'string') {
      return NextResponse.json({ success: false, error: 'Missing or invalid username' }, { status: 400 });
    }

    const result = await runUsernameEnum(body.username);
    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
