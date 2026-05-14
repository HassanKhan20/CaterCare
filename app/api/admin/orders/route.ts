import { NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin-guard';
import { prisma } from '@/lib/prisma';
import { OrderState } from '@prisma/client';

const validOrderStates = new Set(Object.values(OrderState));

export const GET = adminGuard(async (_admin, req: Request) => {
  const url = new URL(req.url);
  const stateParam = url.searchParams.get('state');
  const state = stateParam && validOrderStates.has(stateParam as OrderState)
    ? (stateParam as OrderState)
    : undefined;
  const orders = await prisma.order.findMany({
    where: state ? { state } : {},
    include: {
      cook: { select: { name: true } },
      buyer: { select: { name: true } },
      driver: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  return NextResponse.json({ orders });
});
