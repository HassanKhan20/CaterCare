import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canTransition } from '@/lib/order-state';
import { transferToDriver } from '@/lib/stripe';
import { z } from 'zod';

const Body = z.object({
  to: z.enum(['PICKED_UP', 'DELIVERED']),
  photoUrl: z.string().url(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const { id } = await params;
  const body = Body.parse(await req.json());

  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      driverId: true,
      state: true,
      cookId: true,
      cookPayoutCents: true,
      driverPayoutCents: true,
    },
  });
  if (!order || order.driverId !== session.user.id) {
    return NextResponse.json({ error: 'NOT_YOURS' }, { status: 404 });
  }
  if (!canTransition(order.state, body.to, 'DRIVER')) {
    return NextResponse.json({ error: 'INVALID_TRANSITION' }, { status: 400 });
  }

  // For DELIVERED, the GMV increment + state change must be in the same transaction
  // so the order is never "delivered but not counted." A failure here rolls everything back.
  await prisma.$transaction(async (tx) => {
    const ts: { pickedUpAt?: Date; deliveredAt?: Date } = {};
    if (body.to === 'PICKED_UP') ts.pickedUpAt = new Date();
    if (body.to === 'DELIVERED') ts.deliveredAt = new Date();

    await tx.order.update({ where: { id }, data: { state: body.to, ...ts } });
    await tx.orderEvent.create({
      data: {
        orderId: id,
        fromState: order.state,
        toState: body.to,
        actorUserId: session.user.id,
        note: body.photoUrl,
      },
    });

    if (body.to === 'DELIVERED') {
      // Increment cook's annual GMV (TX cottage food cap tracking).
      // Handles year rollover defensively.
      const currentYear = new Date().getFullYear();
      const cookProfile = await tx.cookProfile.findUnique({
        where: { userId: order.cookId },
      });
      if (cookProfile && cookProfile.annualGmvYear !== currentYear) {
        await tx.cookProfile.update({
          where: { userId: order.cookId },
          data: { annualGmvCents: order.cookPayoutCents, annualGmvYear: currentYear },
        });
      } else {
        await tx.cookProfile.update({
          where: { userId: order.cookId },
          data: { annualGmvCents: { increment: order.cookPayoutCents } },
        });
      }
    }
  });

  // Driver transfer happens OUTSIDE the DB transaction. If it fails, the order is still
  // DELIVERED and admin can retry the transfer via the admin order intervention screen.
  if (body.to === 'DELIVERED') {
    const driverProfile = await prisma.driverProfile.findUnique({
      where: { userId: session.user.id },
      select: { stripeConnectAccountId: true },
    });
    const driverStripe = driverProfile?.stripeConnectAccountId;
    if (driverStripe) {
      try {
        await transferToDriver({
          amountCents: order.driverPayoutCents,
          driverStripeAccountId: driverStripe,
          orderId: order.id,
        });
      } catch (err) {
        // Log for admin retry, but do not roll back the delivered state
        console.error(`Driver transfer failed for order ${id}:`, err);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
