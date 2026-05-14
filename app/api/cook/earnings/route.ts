import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { gmvWarningLevel } from '@/lib/cottage-food';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [week, month, lifetime, recent, profile] = await Promise.all([
    prisma.order.aggregate({
      where: { cookId: session.user.id, state: 'DELIVERED', deliveredAt: { gte: startOfWeek } },
      _sum: { cookPayoutCents: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: { cookId: session.user.id, state: 'DELIVERED', deliveredAt: { gte: startOfMonth } },
      _sum: { cookPayoutCents: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: { cookId: session.user.id, state: 'DELIVERED' },
      _sum: { cookPayoutCents: true },
      _count: true,
    }),
    prisma.order.findMany({
      where: { cookId: session.user.id, state: 'DELIVERED' },
      orderBy: { deliveredAt: 'desc' },
      take: 20,
      select: { id: true, deliveredAt: true, cookPayoutCents: true },
    }),
    prisma.cookProfile.findUnique({
      where: { userId: session.user.id },
      select: { annualGmvCents: true, annualGmvYear: true },
    }),
  ]);

  const gmvLevel = profile ? gmvWarningLevel(profile.annualGmvCents) : 'none';
  return NextResponse.json({
    week,
    month,
    lifetime,
    recent,
    annualGmvCents: profile?.annualGmvCents ?? 0,
    annualGmvYear: profile?.annualGmvYear ?? now.getFullYear(),
    gmvWarning: gmvLevel,
  });
}
