import { NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin-guard';
import { prisma } from '@/lib/prisma';

export const POST = adminGuard(async (admin, _req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const driver = await prisma.driverProfile.findUnique({
    where: { userId: id },
    include: { user: true },
  });
  if (!driver) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

  await prisma.$transaction([
    prisma.driverProfile.update({
      where: { userId: id },
      data: {
        docsStatus: 'APPROVED',
        approvedAt: new Date(),
        approvedByUserId: admin.id,
      },
    }),
    prisma.user.update({ where: { id }, data: { status: 'ACTIVE' } }),
  ]);
  return NextResponse.json({ ok: true });
});
