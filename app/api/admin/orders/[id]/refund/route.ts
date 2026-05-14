import { NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin-guard';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { z } from 'zod';

const Body = z.object({ reason: z.string().min(2).max(500) });

export const POST = adminGuard(async (admin, req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const body = Body.parse(await req.json());

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || !order.stripePaymentIntentId) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }
  if (order.state === 'REFUNDED') {
    return NextResponse.json({ error: 'ALREADY_REFUNDED' }, { status: 400 });
  }

  await stripe.refunds.create({ payment_intent: order.stripePaymentIntentId });

  // GMV was incremented at DELIVERED (B.17). If the order ever reached that
  // in the CURRENT year, decrement to keep the TX cottage cap accurate.
  const wasCountedTowardGmv = !!order.deliveredAt;
  const currentYear = new Date().getFullYear();

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id },
      data: { state: 'REFUNDED', cancellationReason: body.reason },
    });
    await tx.orderEvent.create({
      data: {
        orderId: id,
        fromState: order.state,
        toState: 'REFUNDED',
        actorUserId: admin.id,
        note: body.reason,
      },
    });
    if (wasCountedTowardGmv && order.deliveredAt?.getFullYear() === currentYear) {
      const cookProfile = await tx.cookProfile.findUnique({
        where: { userId: order.cookId },
      });
      if (cookProfile && cookProfile.annualGmvYear === currentYear) {
        await tx.cookProfile.update({
          where: { userId: order.cookId },
          data: {
            annualGmvCents: Math.max(0, cookProfile.annualGmvCents - order.cookPayoutCents),
          },
        });
      }
    }
  });

  return NextResponse.json({ ok: true });
});
