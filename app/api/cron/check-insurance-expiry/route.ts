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

  // 1. Auto-pause drivers with lapsed insurance
  const expired = await prisma.driverProfile.findMany({
    where: { insuranceExpiresAt: { lt: now }, docsStatus: 'APPROVED' },
    include: { user: true },
  });
  for (const d of expired) {
    await prisma.driverProfile.update({
      where: { userId: d.userId },
      data: { isOnline: false, docsStatus: 'NOT_SUBMITTED' },
    });
  }

  // 2. Reminders at 30/14/7 days
  let reminderCount = 0;
  for (const days of [30, 14, 7] as const) {
    const cutoffStart = new Date(now.getTime() + (days - 1) * 86400_000);
    const cutoffEnd = new Date(now.getTime() + days * 86400_000);
    const expiringSoon = await prisma.driverProfile.findMany({
      where: { insuranceExpiresAt: { gte: cutoffStart, lt: cutoffEnd } },
      include: { user: true },
    });
    for (const d of expiringSoon) {
      const t = templates.insuranceExpiringSoon(d.user.name ?? 'there', days);
      await sendEmail({ to: d.user.email, subject: t.subject, html: t.html });
      reminderCount++;
    }
  }

  return NextResponse.json({ paused: expired.length, reminders: reminderCount });
}
