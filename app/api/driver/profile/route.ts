import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { recordAcceptance, hasAcceptedCurrent } from '@/lib/tos';

export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: { roles: { push: 'DRIVER' } },
    }),
    prisma.driverProfile.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id },
      update: {},
    }),
  ]);

  if (!(await hasAcceptedCurrent(session.user.id, 'DRIVER'))) {
    await recordAcceptance({ userId: session.user.id, tosType: 'DRIVER' });
  }
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const profile = await prisma.driverProfile.findUnique({
    where: { userId: session.user.id },
  });
  return NextResponse.json({ profile });
}
