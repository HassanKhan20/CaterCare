import { NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin-guard';
import { prisma } from '@/lib/prisma';
import type { OrderState } from '@prisma/client';

export const GET = adminGuard(async (_admin, req: Request) => {
  const url = new URL(req.url);
  const state = url.searchParams.get('state');
  const orders = await prisma.order.findMany({
    where: state ? { state: state as OrderState } : {},
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
