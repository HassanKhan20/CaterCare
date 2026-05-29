import { NextResponse } from 'next/server';

// Lightweight in-memory fixed-window rate limiter. Good enough as a first
// abuse guard for an MVP. NOTE: on serverless (Vercel) the map is per-instance,
// so this is best-effort, not a global counter — swap in Upstash Redis
// (@upstash/ratelimit) when traffic justifies cross-instance accuracy.
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

// Opportunistic cleanup so the map doesn't grow unbounded.
function sweep(now: number) {
  if (buckets.size < 5000) return;
  for (const [k, b] of buckets) if (b.resetAt < now) buckets.delete(k);
}

export function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]!.trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

/**
 * Returns a 429 NextResponse if the caller exceeded `limit` requests within
 * `windowMs`, otherwise null (proceed). Key is typically `${route}:${ip}`.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): NextResponse | null {
  const now = Date.now();
  sweep(now);
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }
  if (b.count >= limit) {
    const retry = Math.ceil((b.resetAt - now) / 1000);
    return NextResponse.json(
      { error: 'RATE_LIMITED', message: 'Too many requests. Please slow down.' },
      { status: 429, headers: { 'Retry-After': String(retry) } },
    );
  }
  b.count++;
  return null;
}
