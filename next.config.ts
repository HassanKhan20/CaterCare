import type { NextConfig } from "next";

// Content-Security-Policy. Allowlists what the app actually uses:
// - Stripe.js + its payment iframe + API
// - Unsplash (placeholder food photos) + Cloudflare R2 (uploads) over https
// - Mapbox (geocoding/maps)
// 'unsafe-inline' is permitted for scripts/styles because the app relies on
// inline styles throughout and Next's bootstrap; this is the pragmatic MVP
// posture (still blocks framing, restricts object/base-uri, locks frame-src).
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://api.stripe.com https://api.mapbox.com https://*.r2.dev https://*.r2.cloudflarestorage.com",
  "frame-src https://js.stripe.com https://hooks.stripe.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "upgrade-insecure-requests",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    // App uses geolocation (driver location) + camera (delivery photos); deny the rest.
    value: 'camera=(self), geolocation=(self), microphone=(), payment=(self)',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
