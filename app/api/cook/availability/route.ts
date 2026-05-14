import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const Slot = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  orderCutoffMinutes: z.number().int().min(0).max(1440),
  maxOrdersPerDay: z.number().int().min(1).max(100),
});
const Body = z.object({ slots: z.array(Slot) });

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const { slots } = Body.parse(await req.json());

  await prisma.$transaction([
    prisma.cookAvailability.deleteMany({ where: { cookId: session.user.id } }),
    prisma.cookAvailability.createMany({
      data: slots.map((s) => ({ cookId: session.user.id, ...s })),
    }),
  ]);
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const slots = await prisma.cookAvailability.findMany({
    where: { cookId: session.user.id },
    orderBy: { dayOfWeek: 'asc' },
  });
  return NextResponse.json({ slots });
}
