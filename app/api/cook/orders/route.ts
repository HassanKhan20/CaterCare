import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { OrderState } from '@prisma/client';

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const url = new URL(req.url);
  const stateParam = url.searchParams.get('state');

  const orders = await prisma.order.findMany({
    where: {
      cookId: session.user.id,
      ...(stateParam ? { state: stateParam as OrderState } : {}),
    },
    include: {
      items: { include: { dish: { select: { name: true } } } },
      buyer: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return NextResponse.json({ orders });
}
