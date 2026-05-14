import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dish = await prisma.dish.findUnique({
    where: { id },
    include: {
      cook: {
        include: { user: { select: { name: true, status: true } } },
      },
    },
  });
  if (
    !dish ||
    !dish.isActive ||
    !dish.cook.approvedAt ||
    dish.cook.user.status !== 'ACTIVE'
  ) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }
  return NextResponse.json({
    dish: {
      id: dish.id,
      cookId: dish.cookId,
      cookName: dish.cook.user.name,
      name: dish.name,
      description: dish.description,
      photoUrl: dish.photoUrl,
      priceCents: dish.priceCents,
      portionSize: dish.portionSize,
      allergens: dish.allergens,
      leadTimeHours: dish.leadTimeHours,
      dishCategory: dish.dishCategory,
    },
  });
}
