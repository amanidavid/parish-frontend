import { NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register', '/verify-otp', '/forgot-password', '/reset-password'];

function isPublicPath(pathname) {
  if (pathname === '/') return true;
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('app_token')?.value;

  const isPublic = isPublicPath(pathname);
  const isApiRoute = pathname.startsWith('/api/');

  if (isApiRoute) return NextResponse.next();

  if (!token && !isPublic) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (token && isPublic) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)'],
};
