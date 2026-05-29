'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

type Profile = {
  approvedAt: string | null;
  idStatus: string;
  foodHandlerCertStatus: string;
  dshsRegistrationStatus: string;
  stripeOnboardingComplete: boolean;
  annualGmvCents: number;
};

export default function CookDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    fetch('/api/cook/profile')
      .then((r) => r.json())
      .then((j) => setProfile(j.profile));
  }, []);

  if (!profile) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Card>
          <p>Loading…</p>
          <Link href="/cook/onboarding" className="text-brand-400 underline text-sm mt-2 block">
            New cook? Complete onboarding
          </Link>
        </Card>
      </main>
    );
  }

  const checks = [
    { label: 'ID verified', ok: profile.idStatus === 'APPROVED', href: '/cook/profile/id' },
    {
      label: 'Food handler cert',
      ok: profile.foodHandlerCertStatus === 'APPROVED',
      href: '/cook/profile/cert',
    },
    {
      label: 'DSHS registration (required for TCS dishes)',
      ok: profile.dshsRegistrationStatus === 'APPROVED',
      href: '/cook/profile/dshs',
      optional: true,
    },
    { label: 'Stripe payouts', ok: profile.stripeOnboardingComplete, href: '/cook/payouts' },
    { label: 'Approved by admin', ok: !!profile.approvedAt, href: null },
  ];

  return (
    <main className="min-h-screen bg-[var(--color-surface-0)]">
      <header className="border-b bg-[var(--color-surface-1)]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between">
          <Link href="/" className="text-xl font-bold text-brand-400">
            CaterCare
          </Link>
          <div className="flex gap-4 text-sm">
            <Link href="/cook/profile/edit">Profile</Link>
            <Link href="/cook/dishes">Dishes</Link>
            <Link href="/cook/orders">Orders</Link>
            <Link href="/cook/availability">Availability</Link>
            <Link href="/cook/earnings">Earnings</Link>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-3xl font-bold">Cook dashboard</h1>

        <Card>
          <h2 className="font-semibold mb-3">Verification status</h2>
          <ul className="space-y-2 text-sm">
            {checks.map((c) => (
              <li key={c.label} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className={c.ok ? 'text-emerald-700' : 'text-amber-700'}>
                    {c.ok ? '✓' : '○'}
                  </span>
                  {c.label}
                  {c.optional && !c.ok && (
                    <span className="text-xs text-[var(--color-text-tertiary)]">(optional)</span>
                  )}
                </span>
                {c.href && (
                  <Link href={c.href} className="text-brand-400 text-xs hover:underline">
                    {c.ok ? 'Update' : 'Complete'}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </Card>

        {profile.approvedAt && (
          <Card>
            <h2 className="font-semibold mb-1">Annual earnings (TX cottage cap)</h2>
            <p className="text-2xl font-bold">
              ${(profile.annualGmvCents / 100).toLocaleString()}
            </p>
            <p className="text-xs text-[var(--color-text-tertiary)]">$150,000 max under TX SB 541</p>
          </Card>
        )}

        {profile.approvedAt && (
          <Link href="/cook/dishes">
            <Button className="w-full">Manage dishes</Button>
          </Link>
        )}
      </div>
    </main>
  );
}
