'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { getStripeClient } from '@/lib/stripe-client';
import { Btn } from '@/components/ui/Btn';
import { PriceTag } from '@/components/ui/PriceTag';

type Props = {
  clientSecret: string;
  orderId: string;
  totalCents: number;
};

// Inner form — must be a child of <Elements> to access the Stripe context.
function PaymentForm({ orderId, totalCents }: { orderId: string; totalCents: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pay = async () => {
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    const { error: submitErr } = await elements.submit();
    if (submitErr) {
      setError(submitErr.message ?? 'Please check your card details.');
      setSubmitting(false);
      return;
    }

    const { error: confirmErr } = await stripe.confirmPayment({
      elements,
      // For card payments this resolves inline; redirect only happens for
      // methods that require it (none configured for v1, but return_url is required).
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success/${orderId}`,
      },
      redirect: 'if_required',
    });

    if (confirmErr) {
      setError(confirmErr.message ?? 'Payment failed. Your card was not charged.');
      setSubmitting(false);
      return;
    }

    // Success (no redirect needed). The webhook promotes the order DRAFT→PLACED.
    localStorage.removeItem('catercare:cart');
    router.push(`/checkout/success/${orderId}`);
  };

  return (
    <div>
      <PaymentElement />
      {error && (
        <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: 12 }}>{error}</p>
      )}
      <div style={{ marginTop: 20 }}>
        <Btn
          variant="primary"
          size="lg"
          full
          disabled={!stripe || submitting}
          onClick={pay}
        >
          {submitting ? 'Processing…' : 'Pay · '}
          {!submitting && <PriceTag cents={totalCents} />}
        </Btn>
      </div>
    </div>
  );
}

export function PaymentStep({ clientSecret, orderId, totalCents }: Props) {
  return (
    <Elements
      stripe={getStripeClient()}
      options={{
        clientSecret,
        appearance: {
          theme: 'flat',
          variables: {
            colorPrimary: '#5C7546',
            colorBackground: '#F5F6F0',
            colorText: '#1A1D17',
            fontFamily: 'DM Sans, system-ui, sans-serif',
            borderRadius: '4px',
          },
        },
      }}
    >
      <PaymentForm orderId={orderId} totalCents={totalCents} />
    </Elements>
  );
}
