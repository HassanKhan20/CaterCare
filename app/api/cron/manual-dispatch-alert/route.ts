import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
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

// Cold-start safety net: alert the founder/admin when an order has been
// READY_FOR_PICKUP with no driver claim for >15 min, so they can hand-dispatch.
export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });

  const cutoff = new Date(Date.now() - 15 * 60 * 1000);

  const stuck = await prisma.order.findMany({
    where: { state: 'READY_FOR_PICKUP', driverId: null, readyAt: { lt: cutoff } },
    include: {
      cook: { select: { name: true } },
      buyer: { select: { name: true } },
    },
  });

  if (stuck.length === 0) {
    return NextResponse.json({ stuck: 0, alerted: false });
  }

  const admin = await prisma.user.findFirst({ where: { roles: { has: 'ADMIN' } } });
  if (!admin) {
    return NextResponse.json({ stuck: stuck.length, alerted: false, reason: 'no admin user' });
  }

  const appUrl = process.env.APP_URL ?? 'http://localhost:3001';
  const rows = stuck
    .map(
      (o) =>
        `<li>Order #${o.id.slice(-8).toUpperCase()} — ${o.cook.name} → ${o.buyer.name} · ready since ${o.readyAt?.toLocaleString() ?? 'unknown'} · <a href="${appUrl}/admin/orders/${o.id}">assign a driver</a></li>`,
    )
    .join('');

  await sendEmail({
    to: admin.email,
    subject: `⚠️ ${stuck.length} order${stuck.length === 1 ? '' : 's'} waiting for a driver`,
    html: `<p>These orders have been ready for pickup &gt;15 min with no driver:</p><ul>${rows}</ul>`,
  });

  return NextResponse.json({ stuck: stuck.length, alerted: true });
}
