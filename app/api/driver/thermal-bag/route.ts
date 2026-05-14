import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const Body = z.object({
  acknowledged: z.boolean().optional(),
  thermalBagPhotoUrl: z.string().url().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const body = Body.parse(await req.json());
  if (body.acknowledged === undefined && body.thermalBagPhotoUrl === undefined) {
    return NextResponse.json({ error: 'NOTHING_TO_UPDATE' }, { status: 400 });
  }

  await prisma.driverProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      thermalBagAcknowledged: body.acknowledged ?? false,
      thermalBagPhotoUrl: body.thermalBagPhotoUrl,
    },
    update: {
      ...(body.acknowledged !== undefined
        ? { thermalBagAcknowledged: body.acknowledged }
        : {}),
      ...(body.thermalBagPhotoUrl !== undefined
        ? { thermalBagPhotoUrl: body.thermalBagPhotoUrl }
        : {}),
    },
  });
  return NextResponse.json({ ok: true });
}
