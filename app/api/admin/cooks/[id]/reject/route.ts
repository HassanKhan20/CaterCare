import { NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin-guard';
import { prisma } from '@/lib/prisma';
import { sendEmail, templates } from '@/lib/email';
import { z } from 'zod';

const Body = z.object({ reason: z.string().min(2).max(500) });

export const POST = adminGuard(async (_admin, req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const body = Body.parse(await req.json());
  const cookProfile = await prisma.cookProfile.findUnique({
    where: { userId: id },
    include: { user: true },
  });
  if (!cookProfile) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

  await prisma.cookProfile.update({
    where: { userId: id },
    data: { rejectedReason: body.reason },
  });

  const t = templates.cookRejected(cookProfile.user.name ?? 'Cook', body.reason);
  await sendEmail({ to: cookProfile.user.email, subject: t.subject, html: t.html });
  return NextResponse.json({ ok: true });
});
