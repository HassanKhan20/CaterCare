import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { sendEmail, templates } from '@/lib/email';

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: 'NO_SIG' }, { status: 400 });
  const body = await req.text();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: 'NO_SECRET' }, { status: 500 });

  let event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret);
  } catch {
    return NextResponse.json({ error: 'BAD_SIG' }, { status: 400 });
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    const orderId = pi.metadata?.orderId;
    if (!orderId) return NextResponse.json({ received: true });
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { cook: true },
    });
    if (order && order.state === 'DRAFT') {
      await prisma.$transaction([
        prisma.order.update({
          where: { id: orderId },
          data: {
            state: 'PLACED',
            placedAt: new Date(),
            stripeChargeId: pi.latest_charge as string,
          },
        }),
        prisma.orderEvent.create({
          data: { orderId, fromState: 'DRAFT', toState: 'PLACED', note: 'stripe webhook' },
        }),
      ]);
      const t = templates.orderPlaced(order.cook.name ?? 'Cook', orderId);
      await sendEmail({ to: order.cook.email, ...t });
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const pi = event.data.object;
    const orderId = pi.metadata?.orderId;
    if (orderId) {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          state: 'CANCELLED',
          cancelledAt: new Date(),
          cancellationReason: 'payment_failed',
        },
      });
    }
  }

  return NextResponse.json({ received: true });
}
