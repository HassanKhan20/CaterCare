import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { haversineMiles } from '@/lib/geo';
import { computeFinancials, createOrderPaymentIntent } from '@/lib/stripe';
import { recordAcceptance } from '@/lib/tos';
import { env } from '@/lib/env';
import { z } from 'zod';

const Body = z.object({
  cookId: z.string(),
  items: z.array(z.object({ dishId: z.string(), quantity: z.number().int().min(1).max(20) })),
  deliveryAddressId: z.string(),
  tipCents: z.number().int().min(0).max(20000),
  requestedDeliveryAt: z.string().datetime().refine(
    (v) => new Date(v) > new Date(),
    { message: 'Delivery time must be in the future' },
  ),
  buyerNote: z.string().max(500).optional(),
  homeKitchenDisclosureAccepted: z.literal(true),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const body = Body.parse(await req.json());

  const [cook, dishes, address] = await Promise.all([
    prisma.cookProfile.findUnique({
      where: { userId: body.cookId },
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.dish.findMany({
      where: {
        id: { in: body.items.map((i) => i.dishId) },
        cookId: body.cookId,
        isActive: true,
      },
    }),
    prisma.buyerAddress.findUnique({ where: { id: body.deliveryAddressId, buyerId: session.user.id } }),
  ]);
  if (!cook?.approvedAt || !cook.stripeOnboardingComplete) {
    return NextResponse.json({ error: 'COOK_NOT_READY' }, { status: 400 });
  }
  if (!address) {
    return NextResponse.json({ error: 'ADDRESS_NOT_FOUND' }, { status: 400 });
  }
  if (!cook.foodHandlerCertExpiresAt || cook.foodHandlerCertExpiresAt < new Date()) {
    return NextResponse.json({ error: 'COOK_CERT_EXPIRED' }, { status: 400 });
  }

  const subtotalCents = body.items.reduce((sum, it) => {
    const d = dishes.find((x) => x.id === it.dishId);
    return sum + (d?.priceCents ?? 0) * it.quantity;
  }, 0);
  const distanceMiles = haversineMiles(
    { lat: cook.lat!, lng: cook.lng! },
    { lat: address.lat, lng: address.lng },
  );
  const f = computeFinancials({
    subtotalCents,
    distanceMiles,
    tipCents: body.tipCents,
    commissionPct: env.PLATFORM_COMMISSION_PCT,
    serviceFeePct: env.BUYER_SERVICE_FEE_PCT,
    driverBaseCents: env.DRIVER_BASE_PAY_CENTS,
    driverPerMileCents: env.DRIVER_PER_MILE_CENTS,
  });
  const totalChargedCents =
    f.subtotalCents + f.buyerServiceFeeCents + f.deliveryFeeCents + f.driverTipCents;
  const cookPayoutCents = f.subtotalCents - f.cookCommissionCents;
  const driverPayoutCents = f.driverBasePayCents + f.driverTipCents;
  const platformRevenueCents =
    f.cookCommissionCents + f.buyerServiceFeeCents + (f.deliveryFeeCents - f.driverBasePayCents);

  // Snapshot TCS status of this order for the compliance audit trail.
  // Reject if any TCS item is present but the cook has no approved DSHS registration —
  // can happen if a dish flipped between cart and checkout.
  const containsTcsItems = dishes.some((d) => d.dishCategory === 'TCS');
  if (containsTcsItems && cook.dshsRegistrationStatus !== 'APPROVED') {
    return NextResponse.json({ error: 'COOK_TCS_NOT_REGISTERED' }, { status: 400 });
  }

  const order = await prisma.order.create({
    data: {
      buyerId: session.user.id,
      cookId: body.cookId,
      state: 'DRAFT',
      subtotalCents: f.subtotalCents,
      cookCommissionCents: f.cookCommissionCents,
      buyerServiceFeeCents: f.buyerServiceFeeCents,
      deliveryFeeCents: f.deliveryFeeCents,
      driverBasePayCents: f.driverBasePayCents,
      driverTipCents: f.driverTipCents,
      totalChargedCents,
      cookPayoutCents,
      driverPayoutCents,
      platformRevenueCents,
      pickupAddressLine: cook.addressLine ?? '',
      pickupLat: cook.lat!,
      pickupLng: cook.lng!,
      deliveryAddressLine: address.line1,
      deliveryLat: address.lat,
      deliveryLng: address.lng,
      distanceMiles,
      requestedDeliveryAt: new Date(body.requestedDeliveryAt),
      homeKitchenDisclosureAccepted: true,
      homeKitchenDisclosureAcceptedAt: new Date(),
      cookCertSnapshotExpiresAt: cook.foodHandlerCertExpiresAt,
      containsTcsItems,
      buyerNote: body.buyerNote,
      items: {
        create: body.items.map((it) => {
          const d = dishes.find((x) => x.id === it.dishId)!;
          return {
            dishId: it.dishId,
            dishNameSnapshot: d.name,
            unitPriceCents: d.priceCents,
            quantity: it.quantity,
          };
        }),
      },
    },
  });

  let pi;
  try {
    pi = await createOrderPaymentIntent({
      financials: f,
      cookStripeAccountId: cook.stripeConnectAccountId!,
      metadata: {
        orderId: order.id,
        buyerId: session.user.id,
        cookId: body.cookId,
      },
    });
  } catch (err) {
    // Payment setup failed (bad keys, Stripe down, etc.). The order never
    // left DRAFT and has no PaymentIntent — remove it so we don't accumulate
    // orphans, and return a clean error instead of a raw 500.
    console.error('createOrderPaymentIntent failed:', err);
    await prisma.order.delete({ where: { id: order.id } }).catch(() => {});
    return NextResponse.json(
      { error: 'PAYMENT_SETUP_FAILED', message: 'Could not start payment. Please try again.' },
      { status: 502 },
    );
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { stripePaymentIntentId: pi.id },
  });
  await recordAcceptance({ userId: session.user.id, tosType: 'BUYER' });

  return NextResponse.json({ orderId: order.id, clientSecret: pi.client_secret });
}
