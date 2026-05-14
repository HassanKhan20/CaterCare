import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { OrderState } from '@prisma/client';

const validOrderStates = new Set(Object.values(OrderState));

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const url = new URL(req.url);
  const stateParam = url.searchParams.get('state');
  const state = stateParam && validOrderStates.has(stateParam as OrderState)
    ? (stateParam as OrderState)
    : undefined;

  const orders = await prisma.order.findMany({
    where: {
      cookId: session.user.id,
      ...(state ? { state } : {}),
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
