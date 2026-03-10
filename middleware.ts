import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from './lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected routes
  const protectedRoutes = ['/sponsor/dashboard', '/sponsor/projects', '/dashboard/sponsor', '/dashboard/student'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      // No token, redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const payload = await verifyJWT(token);

      if (!payload) {
        // Invalid token, redirect to login
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('auth-token');
        return response;
      }

      // Check role-based access — sponsor paths
      const isSponsorPath = pathname.startsWith('/sponsor/dashboard') || pathname.startsWith('/sponsor/projects') || pathname.startsWith('/dashboard/sponsor');
      if (isSponsorPath && payload.role !== 'sponsor') {
        return NextResponse.redirect(new URL('/dashboard/student', request.url));
      }

      // Redirect legacy /dashboard/sponsor to /sponsor/dashboard for sponsors
      if (pathname.startsWith('/dashboard/sponsor') && payload.role === 'sponsor') {
        return NextResponse.redirect(new URL('/sponsor/dashboard', request.url));
      }

      // Check role-based access — student paths
      if (pathname.startsWith('/dashboard/student') && payload.role !== 'student') {
        return NextResponse.redirect(new URL('/sponsor/dashboard', request.url));
      }

      // Add user info to headers for easy access in pages
      const response = NextResponse.next();
      response.headers.set('x-user-id', payload.userId);
      response.headers.set('x-user-wallet', payload.walletAddress);
      response.headers.set('x-user-role', payload.role);

      return response;
    } catch (error) {
      console.error('Middleware error:', error);
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('auth-token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
