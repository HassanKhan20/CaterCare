import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isProtected = /^\/(cook|admin|driver|buyer)/.test(pathname);
  if (isProtected && !req.auth) {
    return NextResponse.redirect(new URL(`/signin?from=${pathname}`, req.url));
  }
});

export const config = {
  matcher: ['/cook/:path*', '/admin/:path*', '/driver/:path*', '/buyer/:path*'],
};
