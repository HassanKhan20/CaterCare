import { NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin-guard';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { TERMINAL_STATES } from '@/lib/order-state';
import { z } from 'zod';

const Body = z.object({ reason: z.string().min(2).max(500) });

export const POST = adminGuard(async (admin, req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const body = Body.parse(await req.json());
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  if (TERMINAL_STATES.includes(order.state)) {
    return NextResponse.json({ error: 'INVALID_STATE' }, { status: 400 });
  }

  if (order.stripePaymentIntentId) {
    try {
      await stripe.paymentIntents.cancel(order.stripePaymentIntentId);
    } catch (err) {
      console.error('Failed to cancel PaymentIntent:', err);
    }
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id },
      data: {
        state: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: body.reason,
      },
    }),
    prisma.orderEvent.create({
      data: {
        orderId: id,
        fromState: order.state,
        toState: 'CANCELLED',
        actorUserId: admin.id,
        note: body.reason,
      },
    }),
  ]);
  return NextResponse.json({ ok: true });
});
