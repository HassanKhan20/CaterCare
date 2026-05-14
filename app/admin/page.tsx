'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';

type Metrics = {
  activeCooks: number;
  activeDrivers: number;
  activeBuyers: number;
  pendingCookApprovals: number;
  pendingDriverApprovals: number;
  pendingDshs: number;
  thisWeek: { _sum: { totalChargedCents: number | null; platformRevenueCents: number | null }; _count: number };
  lastWeek: { _sum: { totalChargedCents: number | null; platformRevenueCents: number | null }; _count: number };
  stuckOrders: number;
};

export default function AdminDashboard() {
  const [m, setM] = useState<Metrics | null>(null);

  useEffect(() => {
    fetch('/api/admin/metrics')
      .then((r) => r.json())
      .then(setM);
  }, []);

  if (!m) return <main className="p-8">Loading…</main>;

  const gmvThis = (m.thisWeek._sum.totalChargedCents ?? 0) / 100;
  const gmvLast = (m.lastWeek._sum.totalChargedCents ?? 0) / 100;
  const revThis = (m.thisWeek._sum.platformRevenueCents ?? 0) / 100;
  const delta = gmvLast > 0 ? ((gmvThis - gmvLast) / gmvLast) * 100 : 0;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between">
          <Link href="/" className="text-xl font-bold text-brand-700">
            CaterCare Admin
          </Link>
          <div className="flex gap-4 text-sm">
            <Link href="/admin/cooks">Cooks</Link>
            <Link href="/admin/drivers">Drivers</Link>
            <Link href="/admin/orders">Orders</Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        {(m.pendingCookApprovals > 0 || m.pendingDriverApprovals > 0 || m.pendingDshs > 0 || m.stuckOrders > 0) && (
          <Card className="bg-amber-50 border-amber-200 space-y-2">
            <h2 className="font-semibold">Action required</h2>
            <ul className="text-sm space-y-1">
              {m.pendingCookApprovals > 0 && (
                <li>
                  <Link href="/admin/cooks?status=pending" className="text-amber-900 underline">
                    {m.pendingCookApprovals} cook approval{m.pendingCookApprovals === 1 ? '' : 's'} pending
                  </Link>
                </li>
              )}
              {m.pendingDshs > 0 && (
                <li>
                  <Link href="/admin/cooks" className="text-amber-900 underline">
                    {m.pendingDshs} DSHS registration{m.pendingDshs === 1 ? '' : 's'} awaiting review
                  </Link>
                </li>
              )}
              {m.pendingDriverApprovals > 0 && (
                <li>
                  <Link href="/admin/drivers?status=pending" className="text-amber-900 underline">
                    {m.pendingDriverApprovals} driver verification{m.pendingDriverApprovals === 1 ? '' : 's'} pending
                  </Link>
                </li>
              )}
              {m.stuckOrders > 0 && (
                <li>
                  <Link href="/admin/orders?state=READY_FOR_PICKUP" className="text-red-700 font-medium underline">
                    {m.stuckOrders} order{m.stuckOrders === 1 ? '' : 's'} unclaimed &gt;15min — assign a driver!
                  </Link>
                </li>
              )}
            </ul>
          </Card>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Active cooks" value={m.activeCooks} />
          <Stat label="Active drivers" value={m.activeDrivers} />
          <Stat label="Active buyers" value={m.activeBuyers} />
          <Stat label="Orders this week" value={m.thisWeek._count} />
        </div>

        <Card>
          <h2 className="font-semibold mb-3">Revenue</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500">GMV (this week)</p>
              <p className="text-2xl font-bold">${gmvThis.toLocaleString()}</p>
              <p className={`text-xs ${delta >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {delta >= 0 ? '+' : ''}
                {delta.toFixed(1)}% vs last week
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Platform revenue (this week)</p>
              <p className="text-2xl font-bold">${revThis.toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </Card>
  );
}
