import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { haversineMiles } from '@/lib/geo';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const profile = await prisma.driverProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile?.isOnline || profile.currentLat == null || profile.currentLng == null) {
    return NextResponse.json({ jobs: [] });
  }

  const candidates = await prisma.order.findMany({
    where: { state: 'READY_FOR_PICKUP', driverId: null },
    include: {
      cook: { select: { name: true } },
      items: { select: { quantity: true } },
    },
    take: 50,
  });

  const driverLat = profile.currentLat;
  const driverLng = profile.currentLng;

  const jobs = candidates
    .map((o) => ({
      orderId: o.id,
      cookName: o.cook.name,
      pickupAddress: o.pickupAddressLine,
      dropoffAddress: o.deliveryAddressLine,
      distanceMiles: o.distanceMiles,
      basePayCents: o.driverBasePayCents,
      tipCents: o.driverTipCents,
      totalPayCents: o.driverBasePayCents + o.driverTipCents,
      itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
      milesFromYou: haversineMiles(
        { lat: driverLat, lng: driverLng },
        { lat: o.pickupLat, lng: o.pickupLng },
      ),
    }))
    .filter((j) => j.milesFromYou <= 5)
    .sort((a, b) => a.milesFromYou - b.milesFromYou);

  return NextResponse.json({ jobs });
}
