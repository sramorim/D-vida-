import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, extractApiKeyFromHeaders } from '@/lib/auth-core';
import { checkSocialMedia, PLATFORM_CATEGORIES } from '@/lib/social-check';

export async function GET() {
  return NextResponse.json({
    service: 'social-check',
    description: 'Check username presence across social media platforms',
    method: 'POST',
    body: { username: 'string' },
    categories: PLATFORM_CATEGORIES,
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

    const result = await checkSocialMedia(body.username);
    
    // Calcular estatísticas
    const total = result.length;
    const found = result.filter(r => r.exists).length;
    const byCategory = result.reduce((acc, r) => {
      if (!acc[r.category]) acc[r.category] = { total: 0, found: 0 };
      acc[r.category].total++;
      if (r.exists) acc[r.category].found++;
      return acc;
    }, {} as Record<string, { total: number; found: number }>);

    return NextResponse.json({ 
      success: true, 
      data: {
        username: body.username,
        results: result,
        total,
        found,
        byCategory,
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
