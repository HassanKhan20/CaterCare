import { NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin-guard';
import { prisma } from '@/lib/prisma';

export const POST = adminGuard(async (admin, _req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  if (order.state !== 'DRIVER_ASSIGNED' && order.state !== 'PICKED_UP') {
    return NextResponse.json({ error: 'INVALID_STATE' }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id },
      data: { driverId: null, state: 'READY_FOR_PICKUP' },
    }),
    prisma.orderEvent.create({
      data: {
        orderId: id,
        fromState: order.state,
        toState: 'READY_FOR_PICKUP',
        actorUserId: admin.id,
        note: 'reassigned by admin',
      },
    }),
  ]);
  return NextResponse.json({ ok: true });
});
