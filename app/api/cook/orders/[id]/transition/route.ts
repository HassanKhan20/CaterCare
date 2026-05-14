import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canTransition } from '@/lib/order-state';
import { z } from 'zod';

const Body = z.object({
  to: z.enum(['COOK_ACCEPTED', 'COOK_DECLINED', 'PREPARING', 'READY_FOR_PICKUP']),
  note: z.string().max(500).optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const { id } = await params;
  const body = Body.parse(await req.json());

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || order.cookId !== session.user.id) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }
  if (!canTransition(order.state, body.to, 'COOK')) {
    return NextResponse.json({ error: 'INVALID_TRANSITION' }, { status: 400 });
  }

  const timestamps: { acceptedAt?: Date; preparingAt?: Date; readyAt?: Date } = {};
  if (body.to === 'COOK_ACCEPTED') timestamps.acceptedAt = new Date();
  if (body.to === 'PREPARING') timestamps.preparingAt = new Date();
  if (body.to === 'READY_FOR_PICKUP') timestamps.readyAt = new Date();

  await prisma.$transaction([
    prisma.order.update({
      where: { id },
      data: { state: body.to, ...timestamps },
    }),
    prisma.orderEvent.create({
      data: {
        orderId: id,
        fromState: order.state,
        toState: body.to,
        actorUserId: session.user.id,
        note: body.note,
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
