import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const Body = z.object({
  label: z.string().min(1).max(40),
  line1: z.string().min(2).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(2).max(80),
  state: z.string().length(2),
  zip: z.string().min(5).max(10),
  lat: z.number(),
  lng: z.number(),
  isDefault: z.boolean().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const addresses = await prisma.buyerAddress.findMany({
    where: { buyerId: session.user.id },
    orderBy: { isDefault: 'desc' },
  });
  return NextResponse.json({ addresses });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const body = Body.parse(await req.json());

  // Ensure buyer profile exists
  await prisma.buyerProfile.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id },
    update: {},
  });

  if (body.isDefault) {
    await prisma.buyerAddress.updateMany({
      where: { buyerId: session.user.id },
      data: { isDefault: false },
    });
  }

  const address = await prisma.buyerAddress.create({
    data: { ...body, buyerId: session.user.id, isDefault: body.isDefault ?? false },
  });
  return NextResponse.json({ address });
}
