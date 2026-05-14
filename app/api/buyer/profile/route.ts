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
      data: { roles: { push: 'BUYER' }, status: 'ACTIVE' },
    }),
    prisma.buyerProfile.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id },
      update: {},
    }),
  ]);

  if (!(await hasAcceptedCurrent(session.user.id, 'BUYER'))) {
    await recordAcceptance({ userId: session.user.id, tosType: 'BUYER' });
  }
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const profile = await prisma.buyerProfile.findUnique({
    where: { userId: session.user.id },
    include: { addresses: true },
  });
  return NextResponse.json({ profile });
}
