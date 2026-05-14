import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { recordAcceptance, hasAcceptedCurrent } from '@/lib/tos';
import { z } from 'zod';

const Body = z.object({
  story: z.string().min(10).max(2000),
  cuisineTags: z.array(z.string()).min(1).max(5),
  neighborhood: z.string().min(2),
  photoUrl: z.string().url().optional(),
  addressLine: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const body = Body.parse(await req.json());

  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: { roles: { push: 'COOK' } },
    }),
    prisma.cookProfile.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, ...body },
      update: body,
    }),
  ]);

  if (!(await hasAcceptedCurrent(session.user.id, 'COOK'))) {
    await recordAcceptance({ userId: session.user.id, tosType: 'COOK' });
  }
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const profile = await prisma.cookProfile.findUnique({
    where: { userId: session.user.id },
  });
  return NextResponse.json({ profile });
}
