import { SignJWT, jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

export type UserPayload = {
  userId: string;
  email: string;
  tier: string;
};

if (!process.env.JWT_SECRET) {
  console.error('[SHANDON] JWT_SECRET não definido — tokens JWT inseguros')
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'INSECURE-FALLBACK-CHANGE-ME'
);

const COOKIE_NAME = 'shandon-auth-token';

function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function hashPassword(password: string): Promise<string> {
  const salt = generateSalt();
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${salt}:${hashHex}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;

  const encoder = new TextEncoder();
  const data = encoder.encode(salt + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  return hashHex === hash;
}

export async function createToken(payload: UserPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<UserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      tier: payload.tier as string,
    };
  } catch {
    return null;
  }
}

export function setAuthCookie(token: string, response?: NextResponse): NextResponse {
  const res = response || NextResponse.next();
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
  return res;
}

export function clearAuthCookie(response?: NextResponse): NextResponse {
  const res = response || NextResponse.next();
  res.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return res;
}

export async function getAuthFromRequest(request: NextRequest): Promise<UserPayload | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/* ---------- Guards de rota ---------- */

export function isAdminEmail(email: string): boolean {
  return (process.env.SHANDON_ADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .includes(String(email || '').toLowerCase());
}

export type GuardResult = { user: UserPayload | null; error: NextResponse | null };

async function resolveBearer(request: NextRequest): Promise<GuardResult> {
  const fromCookie = await getAuthFromRequest(request);
  if (fromCookie) return { user: fromCookie, error: null };

  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: NextResponse.json({ error: 'Authorization token required' }, { status: 401 }) };
  }
  const user = await verifyToken(authHeader.split(' ')[1]);
  if (!user) {
    return { user: null, error: NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 }) };
  }
  return { user, error: null };
}

export async function requireAnyAuth(request: NextRequest): Promise<GuardResult> {
  return resolveBearer(request);
}

export async function requirePremium(request: NextRequest): Promise<GuardResult> {
  const { user, error } = await resolveBearer(request);
  if (error) return { user: null, error };
  if (user!.tier !== 'premium') {
    return { user: null, error: NextResponse.json({ error: 'This feature requires a premium subscription' }, { status: 403 }) };
  }
  return { user, error: null };
}

export async function requireAdmin(request: NextRequest): Promise<GuardResult> {
  const { user, error } = await resolveBearer(request);
  if (error) return { user: null, error };
  if (!isAdminEmail(user!.email)) {
    return { user: null, error: NextResponse.json({ error: 'Restricted to the platform owner' }, { status: 403 }) };
  }
  return { user, error: null };
}
