import { NextRequest, NextResponse } from 'next/server';
import { requireAnyAuth, isAdminEmail } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { user, error } = await requireAnyAuth(request);
  if (error) return error;

  return NextResponse.json({
    success: true,
    authenticated: true,
    user: {
      id: user!.userId,
      email: user!.email,
      tier: user!.tier,
    },
    isAdmin: isAdminEmail(user!.email),
  });
}