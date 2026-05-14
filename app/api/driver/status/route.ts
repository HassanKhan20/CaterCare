import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const Body = z.object({
  isOnline: z.boolean(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const body = Body.parse(await req.json());

  const profile = await prisma.driverProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile) return NextResponse.json({ error: 'NO_PROFILE' }, { status: 400 });

  if (body.isOnline) {
    const now = new Date();
    if (profile.docsStatus !== 'APPROVED') {
      return NextResponse.json({ error: 'DOCS_PENDING' }, { status: 403 });
    }
    if (profile.backgroundCheckStatus !== 'APPROVED') {
      return NextResponse.json({ error: 'BG_CHECK_PENDING' }, { status: 403 });
    }
    if (!profile.stripeOnboardingComplete) {
      return NextResponse.json({ error: 'STRIPE_INCOMPLETE' }, { status: 403 });
    }
    if (!profile.thermalBagAcknowledged) {
      return NextResponse.json({ error: 'THERMAL_BAG_NOT_ACKED' }, { status: 403 });
    }
    if (!profile.licenseExpiresAt || profile.licenseExpiresAt < now) {
      return NextResponse.json({ error: 'LICENSE_EXPIRED' }, { status: 403 });
    }
    if (!profile.insuranceExpiresAt || profile.insuranceExpiresAt < now) {
      return NextResponse.json({ error: 'INSURANCE_EXPIRED' }, { status: 403 });
    }
  }

  await prisma.driverProfile.update({
    where: { userId: session.user.id },
    data: { isOnline: body.isOnline, currentLat: body.lat, currentLng: body.lng },
  });
  return NextResponse.json({ ok: true });
}
