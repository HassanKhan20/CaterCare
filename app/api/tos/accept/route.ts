import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { recordAcceptance } from '@/lib/tos';
import { z } from 'zod';

const Body = z.object({ tosType: z.enum(['COOK', 'BUYER', 'DRIVER']) });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  const body = Body.parse(await req.json());
  const ip = req.headers.get('x-forwarded-for') ?? undefined;
  await recordAcceptance({
    userId: session.user.id,
    tosType: body.tosType,
    ipAddress: ip,
  });
  return NextResponse.json({ ok: true });
}
