import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

// Routes that require a signed-in user. /cart is intentionally public — a
// buyer can build a basket before signing in; auth kicks in at /checkout.
const PROTECTED = /^\/(cook|admin|driver|account|orders|checkout)(\/|$)/;

export default auth((req) => {
  const { pathname } = req.nextUrl;
  if (PROTECTED.test(pathname) && !req.auth) {
    const url = new URL('/signin', req.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }
});

export const config = {
  matcher: [
    '/cook/:path*',
    '/admin/:path*',
    '/driver/:path*',
    '/account/:path*',
    '/orders/:path*',
    '/checkout/:path*',
  ],
};
