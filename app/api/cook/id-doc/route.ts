import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const Body = z.object({ idDocUrl: z.string().url() });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const { idDocUrl } = Body.parse(await req.json());
  await prisma.cookProfile.update({
    where: { userId: session.user.id },
    data: { idDocUrl, idStatus: 'PENDING' },
  });
  return NextResponse.json({ ok: true });
}
