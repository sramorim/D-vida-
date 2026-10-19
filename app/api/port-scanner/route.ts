import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, extractApiKeyFromHeaders } from '@/lib/auth-core';
import { scanPorts } from '@/lib/port-scanner';

const DEFAULT_PORTS = [
  21, 22, 23, 25, 53, 80, 110, 143, 443, 445,
  993, 995, 1433, 1521, 3306, 3389, 5432, 5900,
  6379, 8080, 8443, 8888, 9200, 27017,
];

export async function GET() {
  return NextResponse.json({
    service: 'port-scanner',
    description: 'Scan common ports on a target host',
    method: 'POST',
    body: { host: 'string', ports: 'number[] (optional)' },
    defaultPorts: DEFAULT_PORTS,
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
    if (!body.host || typeof body.host !== 'string') {
      return NextResponse.json({ success: false, error: 'Missing or invalid host' }, { status: 400 });
    }

    const result = await scanPorts(body.host, body.ports);
    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
