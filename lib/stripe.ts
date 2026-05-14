import Stripe from 'stripe';

// Lazy-initialized so test files importing pure helpers (computeFinancials) don't
// require env vars to be set.
let _stripe: Stripe | null = null;
export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  _stripe = new Stripe(key, { apiVersion: '2025-02-24.acacia' });
  return _stripe;
}

// Backwards-compat export — most call sites use `stripe.xxx`
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const s = getStripe();
    const value = (s as unknown as Record<string | symbol, unknown>)[prop as string];
    return typeof value === 'function' ? (value as (...a: unknown[]) => unknown).bind(s) : value;
  },
});

export async function createConnectAccount(
  email: string,
  userType: 'cook' | 'driver',
) {
  return getStripe().accounts.create({
    type: 'express',
    email,
    capabilities: { transfers: { requested: true } },
    business_type: 'individual',
    metadata: { userType },
  });
}

export async function createOnboardingLink(
  accountId: string,
  refreshUrl: string,
  returnUrl: string,
) {
  return getStripe().accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  });
}

export type OrderFinancials = {
  subtotalCents: number;
  buyerServiceFeeCents: number;
  deliveryFeeCents: number;
  driverTipCents: number;
  cookCommissionCents: number;
  driverBasePayCents: number;
};

/**
 * Creates a PaymentIntent that charges the buyer the full amount and routes
 * the cook's portion through Stripe Connect destination charge. Driver payout
 * is a separate transfer after delivery confirmation.
 */
export async function createOrderPaymentIntent(args: {
  financials: OrderFinancials;
  buyerStripeCustomerId?: string;
  cookStripeAccountId: string;
  metadata: Record<string, string>;
}) {
  const { financials, cookStripeAccountId, metadata } = args;
  const total =
    financials.subtotalCents +
    financials.buyerServiceFeeCents +
    financials.deliveryFeeCents +
    financials.driverTipCents;
  const cookPayout = financials.subtotalCents - financials.cookCommissionCents;

  return getStripe().paymentIntents.create({
    amount: total,
    currency: 'usd',
    automatic_payment_methods: { enabled: true },
    application_fee_amount: total - cookPayout,
    transfer_data: { destination: cookStripeAccountId },
    metadata,
  });
}

export async function transferToDriver(args: {
  amountCents: number;
  driverStripeAccountId: string;
  orderId: string;
}) {
  return getStripe().transfers.create({
    amount: args.amountCents,
    currency: 'usd',
    destination: args.driverStripeAccountId,
    transfer_group: `order_${args.orderId}`,
    metadata: { orderId: args.orderId },
  });
}

export function computeFinancials(args: {
  subtotalCents: number;
  distanceMiles: number;
  tipCents: number;
  commissionPct: number;
  serviceFeePct: number;
  driverBaseCents: number;
  driverPerMileCents: number;
}): OrderFinancials {
  const cookCommissionCents = Math.round((args.subtotalCents * args.commissionPct) / 100);
  const buyerServiceFeeCents = Math.round((args.subtotalCents * args.serviceFeePct) / 100);
  const driverBasePayCents =
    args.driverBaseCents + Math.round(args.distanceMiles * args.driverPerMileCents);
  const deliveryFeeCents = driverBasePayCents + 200; // platform keeps $2 spread
  return {
    subtotalCents: args.subtotalCents,
    buyerServiceFeeCents,
    deliveryFeeCents,
    driverTipCents: args.tipCents,
    cookCommissionCents,
    driverBasePayCents,
  };
}
