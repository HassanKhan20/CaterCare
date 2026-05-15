'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';

type Agg = { _sum: { cookPayoutCents: number | null }; _count: number };
type Recent = { id: string; deliveredAt: string; cookPayoutCents: number };
type Earnings = {
  week: Agg;
  month: Agg;
  lifetime: Agg;
  recent: Recent[];
  annualGmvCents: number;
  annualGmvYear: number;
  gmvWarning: 'none' | 'soft' | 'hard' | 'admin';
};

const GMV_CAP = 15_000_000;

export default function CookEarningsPage() {
  const [data, setData] = useState<Earnings | null>(null);

  useEffect(() => {
    fetch('/api/cook/earnings')
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Loading…</p>
      </main>
    );
  }

  const pct = Math.min(100, (data.annualGmvCents / GMV_CAP) * 100);
  const warningColor =
    data.gmvWarning === 'admin' || data.gmvWarning === 'hard'
      ? 'bg-red-500/100'
      : data.gmvWarning === 'soft'
        ? 'bg-amber-500/100'
        : 'bg-brand-400/150';

  return (
    <main className="min-h-screen bg-[var(--color-surface-0)]">
      <header className="border-b bg-[var(--color-surface-1)]">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/cook" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
            ← Dashboard
          </Link>
        </div>
      </header>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-3xl font-bold">Earnings</h1>

        <div className="grid grid-cols-3 gap-3">
          <Stat
            label="This week"
            cents={data.week._sum.cookPayoutCents ?? 0}
            count={data.week._count}
          />
          <Stat
            label="This month"
            cents={data.month._sum.cookPayoutCents ?? 0}
            count={data.month._count}
          />
          <Stat
            label="All time"
            cents={data.lifetime._sum.cookPayoutCents ?? 0}
            count={data.lifetime._count}
          />
        </div>

        <Card>
          <div className="flex justify-between mb-2">
            <h2 className="font-semibold">{data.annualGmvYear} earnings vs TX $150K cap</h2>
            <span className="text-sm">
              ${(data.annualGmvCents / 100).toLocaleString()} / $150,000
            </span>
          </div>
          <div className="h-3 bg-[var(--color-surface-2)] rounded-full overflow-hidden">
            <div className={`h-full ${warningColor}`} style={{ width: `${pct}%` }} />
          </div>
          {data.gmvWarning === 'soft' && (
            <p className="text-amber-300 text-sm mt-2">
              Approaching $125K. Start thinking about a commercial permit.
            </p>
          )}
          {data.gmvWarning === 'hard' && (
            <p className="text-red-300 text-sm mt-2">
              You&apos;ve crossed $145K. Listings pause at $150K until you obtain a Dallas Retail
              Food Establishment Permit.
            </p>
          )}
          {data.gmvWarning === 'admin' && (
            <p className="text-red-300 font-medium text-sm mt-2">
              You&apos;re very close to the cap. Reach out to support immediately to avoid an
              outage.
            </p>
          )}
        </Card>

        <Card>
          <h2 className="font-semibold mb-3">Recent payouts</h2>
          {data.recent.length === 0 ? (
            <p className="text-sm text-[var(--color-text-secondary)]">No deliveries yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--color-text-tertiary)]">
                  <th className="py-2">Date</th>
                  <th className="text-right">Payout</th>
                </tr>
              </thead>
              <tbody>
                {data.recent.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="py-2">{new Date(r.deliveredAt).toLocaleDateString()}</td>
                    <td className="text-right font-medium">
                      ${(r.cookPayoutCents / 100).toFixed(2)}
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
      <p className="text-xs text-[var(--color-text-tertiary)]">{label}</p>
      <p className="text-2xl font-bold">${(cents / 100).toFixed(2)}</p>
      <p className="text-xs text-[var(--color-text-tertiary)]">{count} orders</p>
    </Card>
  );
}
