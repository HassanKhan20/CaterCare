import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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

// Moves DELIVERED orders to COMPLETED 24h after delivery. This is the point
// where the order is considered final (dispute window closed). Cook GMV was
// already incremented at DELIVERED (driver transition), so this does NOT
// touch GMV — it only finalizes state + stamps completedAt.
export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const due = await prisma.order.findMany({
    where: { state: 'DELIVERED', deliveredAt: { lt: cutoff } },
    select: { id: true, state: true },
  });

  let completed = 0;
  for (const o of due) {
    await prisma.$transaction([
      prisma.order.update({
        where: { id: o.id },
        data: { state: 'COMPLETED', completedAt: new Date() },
      }),
      prisma.orderEvent.create({
        data: {
          orderId: o.id,
          fromState: 'DELIVERED',
          toState: 'COMPLETED',
          note: 'auto-completed 24h after delivery',
        },
      }),
    ]);
    completed++;
  }

  return NextResponse.json({ checked: due.length, completed });
}
