import { NextResponse } from 'next/server';
import { requireRole, UnauthorizedError } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    await requireRole('ADMIN');
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    throw e;
  }
  const url = new URL(req.url);
  const status = url.searchParams.get('status') ?? 'pending';
  const where =
    status === 'pending'
      ? { approvedAt: null }
      : status === 'approved'
        ? { approvedAt: { not: null } }
        : {};
  const cooks = await prisma.cookProfile.findMany({
    where,
    include: { user: { select: { name: true, email: true, status: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  return NextResponse.json({ cooks });
}
