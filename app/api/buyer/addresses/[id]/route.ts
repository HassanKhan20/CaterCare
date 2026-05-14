import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const { id } = await params;
  const address = await prisma.buyerAddress.findUnique({ where: { id } });
  if (!address || address.buyerId !== session.user.id) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }
  await prisma.buyerAddress.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
