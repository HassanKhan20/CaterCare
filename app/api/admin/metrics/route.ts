import { NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin-guard';
import { prisma } from '@/lib/prisma';

export const GET = adminGuard(async () => {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400_000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 86400_000);

  const [
    activeCooks,
    activeDrivers,
    activeBuyers,
    pendingCookApprovals,
    pendingDriverApprovals,
    pendingDshs,
    thisWeek,
    lastWeek,
    stuckOrders,
  ] = await Promise.all([
    prisma.user.count({ where: { roles: { has: 'COOK' }, status: 'ACTIVE' } }),
    prisma.user.count({ where: { roles: { has: 'DRIVER' }, status: 'ACTIVE' } }),
    prisma.user.count({ where: { roles: { has: 'BUYER' }, status: 'ACTIVE' } }),
    prisma.cookProfile.count({ where: { approvedAt: null, idStatus: 'PENDING' } }),
    prisma.driverProfile.count({ where: { docsStatus: 'PENDING' } }),
    prisma.cookProfile.count({ where: { dshsRegistrationStatus: 'PENDING' } }),
    prisma.order.aggregate({
      where: { completedAt: { gte: weekAgo } },
      _sum: { totalChargedCents: true, platformRevenueCents: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: { completedAt: { gte: twoWeeksAgo, lt: weekAgo } },
      _sum: { totalChargedCents: true, platformRevenueCents: true },
      _count: true,
    }),
    prisma.order.count({
      where: {
        state: 'READY_FOR_PICKUP',
        driverId: null,
        readyAt: { lt: new Date(Date.now() - 15 * 60_000) },
      },
    }),
  ]);

  return NextResponse.json({
    activeCooks,
    activeDrivers,
    activeBuyers,
    pendingCookApprovals,
    pendingDriverApprovals,
    pendingDshs,
    thisWeek,
    lastWeek,
    stuckOrders,
  });
});
