import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get token from localStorage via cookie (we'll set it as cookie too)
  const token = request.cookies.get('auth_token')?.value;
  
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                     request.nextUrl.pathname.startsWith('/register');
  
  // Allow access to auth pages
  if (isAuthPage) {
    // If already logged in, redirect to dashboard
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Protect dashboard routes
  const protectedPaths = [
    '/dashboard',
    '/products',
    '/billing',
    '/sales',
    '/customers',
    '/returns',
    '/wastage',
    '/stock',
    '/users',
    '/reports',
    '/settings',
  ];

  const isProtected = protectedPaths.some((path) => 
    request.nextUrl.pathname.startsWith(path)
  );
  
  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
