import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { haversineMiles } from '@/lib/geo';
import { computeFinancials } from '@/lib/stripe';
import { env } from '@/lib/env';
import { z } from 'zod';

const Body = z.object({
  cookId: z.string(),
  items: z.array(z.object({ dishId: z.string(), quantity: z.number().int().min(1).max(20) })),
  deliveryAddressId: z.string(),
  tipCents: z.number().int().min(0).max(20000),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const body = Body.parse(await req.json());

  const [cook, dishes, address] = await Promise.all([
    prisma.cookProfile.findUnique({
      where: { userId: body.cookId },
      include: { user: { select: { name: true } } },
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
  if (!cook || !address) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }

  const subtotalCents = body.items.reduce((sum, it) => {
    const d = dishes.find((x) => x.id === it.dishId);
    return sum + (d?.priceCents ?? 0) * it.quantity;
  }, 0);

  const distanceMiles = haversineMiles(
    { lat: cook.lat!, lng: cook.lng! },
    { lat: address.lat, lng: address.lng },
  );

  const financials = computeFinancials({
    subtotalCents,
    distanceMiles,
    tipCents: body.tipCents,
    commissionPct: env.PLATFORM_COMMISSION_PCT,
    serviceFeePct: env.BUYER_SERVICE_FEE_PCT,
    driverBaseCents: env.DRIVER_BASE_PAY_CENTS,
    driverPerMileCents: env.DRIVER_PER_MILE_CENTS,
  });

  // Category-aware disclosure: TCS dishes get the stronger disclosure language because
  // DSHS registration is part of the claim made to the buyer.
  const containsTcs = dishes.some((d) => d.dishCategory === 'TCS');
  const cookName = cook.user.name ?? 'this cook';
  const disclosureText = containsTcs
    ? `One or more items in this order is a refrigerated/prepared meal (TCS). It is prepared in a private home kitchen by ${cookName}, who holds a current TX food handler certification and Texas DSHS cottage food registration.`
    : `This food is prepared in a private home kitchen by ${cookName}, who holds a current TX food handler certification.`;

  return NextResponse.json({ financials, distanceMiles, containsTcs, disclosureText });
}
