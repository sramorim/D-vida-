import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, extractApiKeyFromHeaders } from '@/lib/auth-core';
import { generateDorks } from '@/lib/google-dorks';

const CATEGORIES = [
  'files',
  'directories',
  'vulnerabilities',
  'sensitive-info',
  'login',
  'subdomains',
  'technologies',
];

export async function GET() {
  return NextResponse.json({
    service: 'google-dorks',
    description: 'Generate Google dork queries for OSINT reconnaissance',
    method: 'POST',
    body: { target: 'string', category: 'string (optional)' },
    categories: CATEGORIES,
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
    if (!body.target || typeof body.target !== 'string') {
      return NextResponse.json({ success: false, error: 'Missing or invalid target' }, { status: 400 });
    }

    const result = await generateDorks(body.target, body.category);
    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
