'use client';
import { loadStripe, type Stripe } from '@stripe/stripe-js';

// Singleton browser Stripe instance. Uses the client-readable publishable key.
let stripePromise: Promise<Stripe | null> | null = null;

export function getStripeClient(): Promise<Stripe | null> {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}
