import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } from '@/lib/password';
import { recordAcceptance } from '@/lib/tos';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { z } from 'zod';

const Body = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(MIN_PASSWORD_LENGTH).max(MAX_PASSWORD_LENGTH),
  // ADMIN is intentionally not self-registerable.
  role: z.enum(['BUYER', 'COOK', 'DRIVER']),
});

export async function POST(req: Request) {
  // Throttle account creation per IP to blunt bulk-signup abuse.
  const limited = rateLimit(`register:${clientIp(req)}`, 5, 60_000);
  if (limited) return limited;

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
  }
  const { name, email, password, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'EMAIL_TAKEN' }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  // Buyers are usable right away; cooks/drivers stay PENDING until an admin
  // approves their verification, matching the existing approval flow.
  const status = role === 'BUYER' ? 'ACTIVE' : 'PENDING';

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      roles: [role],
      status,
      ...(role === 'BUYER' ? { buyerProfile: { create: {} } } : {}),
    },
  });

  await recordAcceptance({ userId: user.id, tosType: role, ipAddress: clientIp(req) });

  return NextResponse.json({ ok: true });
}
