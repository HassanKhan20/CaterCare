import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const orders = await prisma.order.findMany({
    where: { buyerId: session.user.id },
    include: {
      cook: { select: { name: true } },
      items: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return NextResponse.json({ orders });
}
