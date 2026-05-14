import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const Body = z.object({
  foodHandlerCertUrl: z.string().url(),
  foodHandlerCertExpiresAt: z.string().datetime(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const body = Body.parse(await req.json());
  const expires = new Date(body.foodHandlerCertExpiresAt);
  if (expires < new Date()) {
    return NextResponse.json({ error: 'CERT_ALREADY_EXPIRED' }, { status: 400 });
  }
  await prisma.cookProfile.update({
    where: { userId: session.user.id },
    data: {
      foodHandlerCertUrl: body.foodHandlerCertUrl,
      foodHandlerCertExpiresAt: expires,
      foodHandlerCertStatus: 'PENDING',
    },
  });
  return NextResponse.json({ ok: true });
}
