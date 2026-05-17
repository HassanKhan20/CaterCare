'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function DriverPayoutsPage() {
  const [profile, setProfile] = useState<{ stripeOnboardingComplete: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/driver/profile')
      .then((r) => r.json())
      .then((j) => setProfile(j.profile));
  }, []);

  const startOnboarding = async () => {
    setSubmitting(true);
    const res = await fetch('/api/driver/stripe/onboard', { method: 'POST' });
    const json = await res.json();
    if (json.url) window.location.href = json.url;
    setSubmitting(false);
  };

  return (
    <main className="min-h-screen bg-[var(--color-surface-0)]">
      <header className="border-b bg-[var(--color-surface-1)]">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/driver" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
            ← Dashboard
          </Link>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-3xl font-bold">Payout setup</h1>
        <Card>
          {profile?.stripeOnboardingComplete ? (
            <>
              <p className="text-emerald-700 font-medium">✓ Your payout account is linked.</p>
              <p className="text-sm text-[var(--color-text-secondary)] mt-2">
                Earnings transfer automatically after delivery.
              </p>
              <Button
                variant="secondary"
                className="mt-3"
                onClick={startOnboarding}
                disabled={submitting}
              >
                Update payout info
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm mb-3">
                Connect your bank account through Stripe to receive payouts. To enable
                instant payouts (1% fee), link a debit card during onboarding.
              </p>
              <Button onClick={startOnboarding} disabled={submitting}>
                {submitting ? '…' : 'Start Stripe onboarding'}
              </Button>
            </>
          )}
        </Card>
      </div>
    </main>
  );
}
