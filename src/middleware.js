import { NextResponse } from 'next/server';
import { decrypt } from './lib/Auth';

export async function middleware(request) {
  const protectedPaths = ['/admin', '/businessaccount', '/officers'];
  const { pathname } = request.nextUrl;

  if (protectedPaths.some(path => pathname.startsWith(path))) {
    const token = request.cookies.get('session')?.value;
    if (!token) return NextResponse.redirect(new URL('/login', request.url));

    try {
      const session = await decrypt(token);
      const role = session?.user?.role;

      if (!session?.user?.id || !role) {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      // 🔒 Strict role isolation — block cross-role access
      const rolePathMap = {
        admin: '/admin',
        business: '/businessaccount',
        officer: '/officers',
      };

      const expectedPath = rolePathMap[role];
      if (!pathname.startsWith(expectedPath)) {
        return NextResponse.redirect(new URL(expectedPath, request.url));
      }

    } catch (err) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/businessaccount/:path*', '/officers/:path*'],
};
