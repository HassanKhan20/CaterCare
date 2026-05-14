import { NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin-guard';
import { prisma } from '@/lib/prisma';

export const POST = adminGuard(async (_admin, _req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  await prisma.user.update({ where: { id }, data: { status: 'ACTIVE' } });
  return NextResponse.json({ ok: true });
});
