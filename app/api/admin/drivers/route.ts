import { NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin-guard';
import { prisma } from '@/lib/prisma';

export const GET = adminGuard(async (_admin, req: Request) => {
  const url = new URL(req.url);
  const status = url.searchParams.get('status') ?? 'pending';
  const where =
    status === 'pending'
      ? { docsStatus: 'PENDING' as const }
      : status === 'approved'
        ? { approvedAt: { not: null } }
        : {};
  const drivers = await prisma.driverProfile.findMany({
    where,
    include: { user: { select: { name: true, email: true, status: true } } },
    orderBy: { user: { createdAt: 'desc' } },
    take: 200,
  });
  return NextResponse.json({ drivers });
});
