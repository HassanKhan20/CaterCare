import { NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin-guard';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const Body = z.object({ reason: z.string().min(2).max(500) });

export const POST = adminGuard(async (_admin, req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const body = Body.parse(await req.json());
  await prisma.driverProfile.update({
    where: { userId: id },
    data: { docsStatus: 'REJECTED', rejectedReason: body.reason },
  });
  return NextResponse.json({ ok: true });
});
