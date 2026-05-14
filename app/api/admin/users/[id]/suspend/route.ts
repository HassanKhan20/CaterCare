import { NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin-guard';
import { prisma } from '@/lib/prisma';

export const POST = adminGuard(async (_admin, _req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  await prisma.$transaction([
    prisma.user.update({ where: { id }, data: { status: 'SUSPENDED' } }),
    // Deactivate all dishes so the cook can't receive new orders
    prisma.dish.updateMany({ where: { cookId: id }, data: { isActive: false } }),
    // Force driver offline immediately
    prisma.driverProfile.updateMany({ where: { userId: id }, data: { isOnline: false } }),
    // Revoke all sessions so the user is logged out immediately
    prisma.session.deleteMany({ where: { userId: id } }),
  ]);
  return NextResponse.json({ ok: true });
});
