import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getStripe, createOnboardingLink } from '@/lib/stripe';
import { rateLimit } from '@/lib/rate-limit';
import Stripe from 'stripe';

export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  // Instant payouts move money — cap attempts per driver.
  const limited = rateLimit(`payout:${session.user.id}`, 5, 60_000);
  if (limited) return limited;

  const profile = await prisma.driverProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile?.stripeConnectAccountId) {
    return NextResponse.json({ error: 'NO_STRIPE' }, { status: 400 });
  }

  const stripe = getStripe();

  // 1. Verify a debit card is on file as an external account (instant payouts require this).
  //    A bank account alone is not sufficient.
  const externalAccounts = await stripe.accounts.listExternalAccounts(
    profile.stripeConnectAccountId,
    { object: 'card', limit: 1 },
  );
  if (externalAccounts.data.length === 0) {
    const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
    const link = await createOnboardingLink(
      profile.stripeConnectAccountId,
      `${appUrl}/driver/earnings`,
      `${appUrl}/driver/earnings`,
    );
    return NextResponse.json(
      {
        error: 'NO_DEBIT_CARD',
        message:
          'Link a debit card to enable instant payouts. Bank transfers still arrive on the regular schedule.',
        onboardingUrl: link.url,
      },
      { status: 400 },
    );
  }

  // 2. Check balance
  const balance = await stripe.balance.retrieve({
    stripeAccount: profile.stripeConnectAccountId,
  });
  const available = balance.available.find((b) => b.currency === 'usd')?.amount ?? 0;
  if (available <= 0) {
    return NextResponse.json({ error: 'NO_BALANCE' }, { status: 400 });
  }

  // 3. Attempt the instant payout — Stripe may still reject for risk reasons.
  try {
    const payout = await stripe.payouts.create(
      { amount: available, currency: 'usd', method: 'instant' },
      { stripeAccount: profile.stripeConnectAccountId },
    );
    return NextResponse.json({ payout });
  } catch (err) {
    if (
      err instanceof Stripe.errors.StripeInvalidRequestError &&
      err.code === 'instant_payouts_unavailable'
    ) {
      return NextResponse.json(
        {
          error: 'INSTANT_PAYOUTS_UNAVAILABLE',
          message:
            'Instant payouts are temporarily unavailable on your account. Your earnings will arrive on the standard 2-day schedule.',
        },
        { status: 400 },
      );
    }
    throw err;
  }
}
