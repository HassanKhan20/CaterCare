import { NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin-guard';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Manual background check workflow for v1. Admin reviews docs (and optionally
// runs Checkr off-platform), then sets the result here.
const Body = z.object({
  result: z.enum(['APPROVED', 'REJECTED']),
});

export const POST = adminGuard(async (_admin, req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const body = Body.parse(await req.json());
  await prisma.driverProfile.update({
    where: { userId: id },
    data: {
      backgroundCheckStatus: body.result,
      backgroundCheckCompletedAt: new Date(),
    },
  });
  return NextResponse.json({ ok: true });
});
