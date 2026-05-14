import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const Body = z.object({
  licenseDocUrl: z.string().url(),
  licenseExpiresAt: z.string().datetime(),
  insuranceDocUrl: z.string().url(),
  insuranceExpiresAt: z.string().datetime(),
  idDocUrl: z.string().url(),
  carPhotoUrl: z.string().url(),
  dateOfBirth: z.string().datetime(),
});

const EIGHTEEN_YEARS_MS = 18 * 365.25 * 86400_000;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const body = Body.parse(await req.json());

  const dob = new Date(body.dateOfBirth);
  if (Date.now() - dob.getTime() < EIGHTEEN_YEARS_MS) {
    return NextResponse.json({ error: 'UNDER_18' }, { status: 400 });
  }

  const data = {
    licenseDocUrl: body.licenseDocUrl,
    licenseExpiresAt: new Date(body.licenseExpiresAt),
    insuranceDocUrl: body.insuranceDocUrl,
    insuranceExpiresAt: new Date(body.insuranceExpiresAt),
    idDocUrl: body.idDocUrl,
    carPhotoUrl: body.carPhotoUrl,
    dateOfBirth: dob,
    docsStatus: 'PENDING' as const,
  };

  await prisma.driverProfile.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, ...data },
    update: data,
  });

  return NextResponse.json({ ok: true });
}
