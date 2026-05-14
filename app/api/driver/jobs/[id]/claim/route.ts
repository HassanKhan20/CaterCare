import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const { id } = await params;

  // Verify driver is eligible
  const profile = await prisma.driverProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile?.isOnline) return NextResponse.json({ error: 'NOT_ONLINE' }, { status: 403 });

  // Atomic claim: only succeeds if state==READY_FOR_PICKUP and driverId==null
  const result = await prisma.order.updateMany({
    where: { id, state: 'READY_FOR_PICKUP', driverId: null },
    data: { driverId: session.user.id, state: 'DRIVER_ASSIGNED' },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: 'ALREADY_CLAIMED' }, { status: 409 });
  }

  await prisma.orderEvent.create({
    data: {
      orderId: id,
      fromState: 'READY_FOR_PICKUP',
      toState: 'DRIVER_ASSIGNED',
      actorUserId: session.user.id,
    },
  });
  return NextResponse.json({ ok: true });
}
