import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

/**
 * POST /api/auth/logout
 * Logout user by clearing auth cookie
 */
export async function POST(request: NextRequest) {
  const response = NextResponse.json({
    message: 'Logged out successfully',
  });

  response.headers.set('Set-Cookie', clearAuthCookie());

  return response;
}
