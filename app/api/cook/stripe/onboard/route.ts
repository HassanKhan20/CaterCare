import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createConnectAccount, createOnboardingLink } from '@/lib/stripe';

export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  let profile = await prisma.cookProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile) return NextResponse.json({ error: 'NO_PROFILE' }, { status: 400 });

  if (!profile.stripeConnectAccountId) {
    const account = await createConnectAccount(session.user.email!, 'cook');
    profile = await prisma.cookProfile.update({
      where: { userId: session.user.id },
      data: { stripeConnectAccountId: account.id },
    });
  }

  const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
  const link = await createOnboardingLink(
    profile.stripeConnectAccountId!,
    `${appUrl}/cook/payouts`,
    `${appUrl}/api/cook/stripe/return`,
  );
  return NextResponse.json({ url: link.url });
}
