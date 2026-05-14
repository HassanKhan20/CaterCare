'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

type Agg = { _sum: { driverPayoutCents: number | null }; _count: number };
type Recent = {
  id: string;
  deliveredAt: string;
  driverBasePayCents: number;
  driverTipCents: number;
  driverPayoutCents: number;
};
type Earnings = {
  week: Agg;
  month: Agg;
  lifetime: Agg;
  recent: Recent[];
};

export default function DriverEarningsPage() {
  const [data, setData] = useState<Earnings | null>(null);
  const [payoutMessage, setPayoutMessage] = useState<string | null>(null);
  const [onboardingUrl, setOnboardingUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/driver/earnings')
      .then((r) => r.json())
      .then(setData);
  }, []);

  const payoutNow = async () => {
    setSubmitting(true);
    setPayoutMessage(null);
    setOnboardingUrl(null);
    const res = await fetch('/api/driver/payout', { method: 'POST' });
    const json = await res.json();
    if (res.ok) {
      setPayoutMessage(`Instant payout sent — should arrive within minutes.`);
    } else {
      setPayoutMessage(json.message ?? json.error ?? 'Payout failed.');
      if (json.onboardingUrl) setOnboardingUrl(json.onboardingUrl);
    }
    setSubmitting(false);
  };

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Loading…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/driver" className="text-sm text-slate-600 hover:text-slate-900">
            ← Dashboard
          </Link>
        </div>
      </header>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-3xl font-bold">Earnings</h1>

        <div className="grid grid-cols-3 gap-3">
          <Stat
            label="This week"
            cents={data.week._sum.driverPayoutCents ?? 0}
            count={data.week._count}
          />
          <Stat
            label="This month"
            cents={data.month._sum.driverPayoutCents ?? 0}
            count={data.month._count}
          />
          <Stat
            label="All time"
            cents={data.lifetime._sum.driverPayoutCents ?? 0}
            count={data.lifetime._count}
          />
        </div>

        <Card>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-semibold">Instant payout</h2>
              <p className="text-sm text-slate-600">1% Stripe fee. Bank transfers free.</p>
            </div>
            <Button onClick={payoutNow} disabled={submitting}>
              {submitting ? '…' : 'Pay me now'}
            </Button>
          </div>
          {payoutMessage && (
            <div className="mt-3 text-sm">
              <p>{payoutMessage}</p>
              {onboardingUrl && (
                <a
                  href={onboardingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-700 underline"
                >
                  Link a debit card →
                </a>
              )}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="font-semibold mb-3">Recent deliveries</h2>
          {data.recent.length === 0 ? (
            <p className="text-sm text-slate-600">No deliveries yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-2">Date</th>
                  <th>Base</th>
                  <th>Tip</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.recent.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="py-2">{new Date(r.deliveredAt).toLocaleDateString()}</td>
                    <td>${(r.driverBasePayCents / 100).toFixed(2)}</td>
                    <td>${(r.driverTipCents / 100).toFixed(2)}</td>
                    <td className="text-right font-medium">
                      ${(r.driverPayoutCents / 100).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </main>
  );
}

function Stat({ label, cents, count }: { label: string; cents: number; count: number }) {
  return (
    <Card>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-2xl font-bold">${(cents / 100).toFixed(2)}</p>
      <p className="text-xs text-slate-500">{count} deliveries</p>
    </Card>
  );
}
