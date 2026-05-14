import { NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin-guard';
import { prisma } from '@/lib/prisma';

export const POST = adminGuard(async (_admin, _req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  await prisma.$transaction([
    prisma.cookProfile.update({
      where: { userId: id },
      data: { dshsRegistrationStatus: 'APPROVED' },
    }),
    // Auto-activate any TCS dishes that were waiting on DSHS approval.
    prisma.dish.updateMany({
      where: { cookId: id, dishCategory: 'TCS', isActive: false },
      data: { isActive: true },
    }),
  ]);
  return NextResponse.json({ ok: true });
});
