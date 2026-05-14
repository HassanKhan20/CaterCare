import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cook = await prisma.cookProfile.findUnique({
    where: { userId: id },
    include: {
      user: { select: { name: true, status: true } },
      dishes: { where: { isActive: true }, orderBy: { createdAt: 'desc' } },
      availability: { orderBy: { dayOfWeek: 'asc' } },
    },
  });
  if (!cook || !cook.approvedAt || cook.user.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }
  return NextResponse.json({
    cook: {
      id: cook.userId,
      name: cook.user.name,
      photoUrl: cook.photoUrl,
      story: cook.story,
      cuisineTags: cook.cuisineTags,
      neighborhood: cook.neighborhood,
      dishes: cook.dishes,
      availability: cook.availability,
    },
  });
}
