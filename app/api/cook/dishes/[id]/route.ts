import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const Patch = z.object({
  name: z.string().min(2).max(80).optional(),
  description: z.string().min(10).max(1000).optional(),
  photoUrl: z.string().url().optional(),
  priceCents: z.number().int().min(100).max(50000).optional(),
  portionSize: z.string().optional(),
  allergens: z.array(z.string()).optional(),
  leadTimeHours: z.number().int().min(0).max(168).optional(),
  isActive: z.boolean().optional(),
});

async function loadOwnedDish(dishId: string, userId: string) {
  const dish = await prisma.dish.findUnique({ where: { id: dishId } });
  if (!dish || dish.cookId !== userId) return null;
  return dish;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const { id } = await params;
  const dish = await loadOwnedDish(id, session.user.id);
  if (!dish) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  const body = Patch.parse(await req.json());
  const updated = await prisma.dish.update({ where: { id }, data: body });
  return NextResponse.json({ dish: updated });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const { id } = await params;
  const dish = await loadOwnedDish(id, session.user.id);
  if (!dish) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  // Soft delete
  await prisma.dish.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}
