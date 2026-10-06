import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');
  // Staff-only areas: admin panel and printable documents
  const isAdminPage = pathname.startsWith('/admin') || pathname.startsWith('/print');

  if (!token && isAdminPage) {
    // Not signed in: send to login and come back here afterwards.
    // Role checks happen client-side (admin layout) and, authoritatively, on the API.
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  if (token && isAuthPage) {
    // Already signed in: login/signup pages make no sense
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/print/:path*', '/login', '/signup'],
};
