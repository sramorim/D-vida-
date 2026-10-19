import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, extractApiKeyFromHeaders } from '@/lib/auth-core';
import { checkPasswordLeak } from '@/lib/password-leak';

export async function GET() {
  return NextResponse.json({
    service: 'password-leak',
    description: 'Check if a password has appeared in known data breaches',
    method: 'POST',
    body: { password: 'string' },
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
    if (!body.password || typeof body.password !== 'string') {
      return NextResponse.json({ success: false, error: 'Missing or invalid password' }, { status: 400 });
    }

    const result = await checkPasswordLeak(body.password);
    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
