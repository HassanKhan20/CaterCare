'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

type Profile = {
  isOnline: boolean;
  docsStatus: string;
  backgroundCheckStatus: string;
  stripeOnboardingComplete: boolean;
  thermalBagAcknowledged: boolean;
  licenseExpiresAt: string | null;
  insuranceExpiresAt: string | null;
};

export default function DriverDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const res = await fetch('/api/driver/profile');
    if (res.ok) setProfile((await res.json()).profile);
  };
  useEffect(() => {
    load();
  }, []);

  const toggleOnline = async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);
    const next = !profile.isOnline;

    let lat: number | undefined;
    let lng: number | undefined;
    if (next && navigator.geolocation) {
      await new Promise<void>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            lat = pos.coords.latitude;
            lng = pos.coords.longitude;
            resolve();
          },
          () => resolve(),
          { timeout: 5000 },
        );
      });
    }

    const res = await fetch('/api/driver/status', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ isOnline: next, lat, lng }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? 'Failed');
    } else {
      await load();
    }
    setLoading(false);
  };

  if (!profile) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Card>
          <p>Loading…</p>
          <Link href="/driver/onboarding" className="text-brand-700 underline text-sm mt-2 block">
            New driver? Complete onboarding
          </Link>
        </Card>
      </main>
    );
  }

  const allChecks = [
    { label: 'Documents approved', ok: profile.docsStatus === 'APPROVED' },
    { label: 'Background check', ok: profile.backgroundCheckStatus === 'APPROVED' },
    { label: 'Stripe payout linked', ok: profile.stripeOnboardingComplete },
    { label: 'Thermal bag confirmed', ok: profile.thermalBagAcknowledged },
    {
      label: 'License valid',
      ok: !!profile.licenseExpiresAt && new Date(profile.licenseExpiresAt) > new Date(),
    },
    {
      label: 'Insurance valid',
      ok: !!profile.insuranceExpiresAt && new Date(profile.insuranceExpiresAt) > new Date(),
    },
  ];
  const eligible = allChecks.every((c) => c.ok);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between">
          <Link href="/" className="text-xl font-bold text-brand-700">
            CaterCare
          </Link>
          <div className="flex gap-4 text-sm">
            <Link href="/driver/earnings">Earnings</Link>
            <Link href="/driver/payouts">Payouts</Link>
            <Link href="/driver/verification">Verification</Link>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-3xl font-bold">Driver dashboard</h1>

        <Card>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="font-semibold">Status</h2>
              <p className="text-sm text-slate-600">
                {profile.isOnline ? 'You are accepting jobs.' : 'You are offline.'}
              </p>
            </div>
            <Button
              variant={profile.isOnline ? 'danger' : 'primary'}
              onClick={toggleOnline}
              disabled={(!eligible && !profile.isOnline) || loading}
            >
              {loading ? '…' : profile.isOnline ? 'Go offline' : 'Go online'}
            </Button>
          </div>
          {error && <p className="text-sm text-red-700 mb-3">{error}</p>}
          <ul className="space-y-1 text-sm">
            {allChecks.map((c) => (
              <li key={c.label} className="flex items-center gap-2">
                <span className={c.ok ? 'text-green-600' : 'text-amber-600'}>
                  {c.ok ? '✓' : '○'}
                </span>
                {c.label}
              </li>
            ))}
          </ul>
        </Card>

        {profile.isOnline && (
          <Link href="/driver/jobs">
            <Button className="w-full">See available jobs</Button>
          </Link>
        )}
      </div>
    </main>
  );
}
