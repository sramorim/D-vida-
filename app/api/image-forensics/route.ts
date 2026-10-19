import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, extractApiKeyFromHeaders } from '@/lib/auth-core';
import { analyzeImage } from '@/lib/image-forensics';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      service: 'image-forensics',
      description: 'Image forensics and metadata analysis',
      method: 'POST',
      body: { url: 'string' },
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
    if (!body.url) {
      return NextResponse.json({ success: false, error: 'url is required' }, { status: 400 });
    }

    const result = await analyzeImage(body.url);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
