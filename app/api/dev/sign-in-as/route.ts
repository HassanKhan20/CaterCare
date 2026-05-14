import { NextResponse } from 'next/server';
import { signIn } from '@/lib/auth';
import { z } from 'zod';

const Body = z.object({ email: z.string().email() });

// DEV-ONLY: signs you in as a seeded user via the dev-credentials provider.
// Returns 403 in production.
export async function POST(req: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'DISABLED_IN_PROD' }, { status: 403 });
  }
  const { email } = Body.parse(await req.json());

  try {
    await signIn('dev-credentials', { email, redirect: false });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Dev signin error:', err);
    return NextResponse.json(
      { error: 'SIGN_IN_FAILED', message: String(err) },
      { status: 400 },
    );
  }
}
