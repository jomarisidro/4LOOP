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
      if (!session?.user?.id || !session?.user?.role) {
        return NextResponse.redirect(new URL('/login', request.url));
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
