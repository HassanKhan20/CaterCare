import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [week, month, lifetime, recent] = await Promise.all([
    prisma.order.aggregate({
      where: { driverId: session.user.id, state: 'DELIVERED', deliveredAt: { gte: startOfWeek } },
      _sum: { driverPayoutCents: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: { driverId: session.user.id, state: 'DELIVERED', deliveredAt: { gte: startOfMonth } },
      _sum: { driverPayoutCents: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: { driverId: session.user.id, state: 'DELIVERED' },
      _sum: { driverPayoutCents: true },
      _count: true,
    }),
    prisma.order.findMany({
      where: { driverId: session.user.id, state: 'DELIVERED' },
      orderBy: { deliveredAt: 'desc' },
      take: 20,
      select: {
        id: true,
        deliveredAt: true,
        driverBasePayCents: true,
        driverTipCents: true,
        driverPayoutCents: true,
      },
    }),
  ]);

  return NextResponse.json({ week, month, lifetime, recent });
}
