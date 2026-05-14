import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail, templates } from '@/lib/email';
import { env } from '@/lib/env';
import crypto from 'crypto';

function authorized(req: Request): boolean {
  const header = req.headers.get('authorization') ?? '';
  const expected = `Bearer ${env.CRON_SECRET}`;
  if (header.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(header), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });

  const now = new Date();

  // 1. Disable cooks whose food handler cert just expired
  const expiredCerts = await prisma.cookProfile.findMany({
    where: {
      foodHandlerCertExpiresAt: { lt: now },
      foodHandlerCertStatus: 'APPROVED',
    },
    include: { user: true },
  });
  for (const c of expiredCerts) {
    await prisma.$transaction([
      prisma.cookProfile.update({
        where: { userId: c.userId },
        data: { foodHandlerCertStatus: 'NOT_SUBMITTED' },
      }),
      prisma.dish.updateMany({
        where: { cookId: c.userId },
        data: { isActive: false },
      }),
    ]);
  }

  // 2. Send reminders at 30 / 14 / 7 days
  let reminderCount = 0;
  for (const days of [30, 14, 7] as const) {
    const cutoffStart = new Date(now.getTime() + (days - 1) * 86400_000);
    const cutoffEnd = new Date(now.getTime() + days * 86400_000);
    const expiringSoon = await prisma.cookProfile.findMany({
      where: { foodHandlerCertExpiresAt: { gte: cutoffStart, lt: cutoffEnd } },
      include: { user: true },
    });
    for (const c of expiringSoon) {
      const t = templates.certExpiringSoon(c.user.name ?? 'there', days);
      await sendEmail({ to: c.user.email, subject: t.subject, html: t.html });
      reminderCount++;
    }
  }

  return NextResponse.json({ disabled: expiredCerts.length, reminders: reminderCount });
}
