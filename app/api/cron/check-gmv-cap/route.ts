import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail, templates } from '@/lib/email';
import { gmvWarningLevel } from '@/lib/cottage-food';
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

  const currentYear = new Date().getFullYear();
  const cooks = await prisma.cookProfile.findMany({
    where: { approvedAt: { not: null } },
    include: { user: true },
  });

  let resetCount = 0;
  let alertCount = 0;
  for (const c of cooks) {
    if (c.annualGmvYear !== currentYear) {
      await prisma.cookProfile.update({
        where: { userId: c.userId },
        data: { annualGmvCents: 0, annualGmvYear: currentYear },
      });
      resetCount++;
      continue;
    }
    const level = gmvWarningLevel(c.annualGmvCents);
    const gmvDollars = Math.round(c.annualGmvCents / 100);
    if (level === 'soft') {
      const t = templates.cottageCapSoftWarning(c.user.name ?? 'Cook', gmvDollars);
      await sendEmail({ to: c.user.email, subject: t.subject, html: t.html });
      alertCount++;
    } else if (level === 'hard') {
      const t = templates.cottageCapHardWarning(c.user.name ?? 'Cook', gmvDollars);
      await sendEmail({ to: c.user.email, subject: t.subject, html: t.html });
      alertCount++;
    } else if (level === 'admin') {
      const admin = await prisma.user.findFirst({ where: { roles: { has: 'ADMIN' } } });
      if (admin) {
        const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
        await sendEmail({
          to: admin.email,
          subject: `⚠️ Cook ${c.user.name} at $${gmvDollars.toLocaleString()} — TX $150K cap`,
          html: `<p>Cook ${c.user.name} (${c.user.email}) has earned $${gmvDollars.toLocaleString()} this year. Review at ${appUrl}/admin/cooks/${c.userId}.</p>`,
        });
        alertCount++;
      }
    }
  }

  return NextResponse.json({ checked: cooks.length, reset: resetCount, alerts: alertCount });
}
