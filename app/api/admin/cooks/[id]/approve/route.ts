import { NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin-guard';
import { prisma } from '@/lib/prisma';
import { sendEmail, templates } from '@/lib/email';

export const POST = adminGuard(async (admin, _req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const cookProfile = await prisma.cookProfile.findUnique({
    where: { userId: id },
    include: { user: true },
  });
  if (!cookProfile) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

  await prisma.$transaction([
    prisma.cookProfile.update({
      where: { userId: id },
      data: {
        approvedAt: new Date(),
        approvedByUserId: admin.id,
        idStatus: 'APPROVED',
        foodHandlerCertStatus: 'APPROVED',
      },
    }),
    prisma.user.update({ where: { id }, data: { status: 'ACTIVE' } }),
  ]);

  const t = templates.cookApproved(cookProfile.user.name ?? 'Cook');
  await sendEmail({ to: cookProfile.user.email, subject: t.subject, html: t.html });
  return NextResponse.json({ ok: true });
});
