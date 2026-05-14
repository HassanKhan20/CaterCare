import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getStripe } from '@/lib/stripe';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const profile = await prisma.driverProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile?.stripeConnectAccountId) {
    return NextResponse.json({ error: 'NO_STRIPE' }, { status: 400 });
  }

  const account = await getStripe().accounts.retrieve(profile.stripeConnectAccountId);
  if (account.details_submitted) {
    await prisma.driverProfile.update({
      where: { userId: session.user.id },
      data: { stripeOnboardingComplete: true },
    });
  }

  const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
  return NextResponse.redirect(`${appUrl}/driver/payouts`);
}
