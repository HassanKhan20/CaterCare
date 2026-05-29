'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

type Job = {
  orderId: string;
  cookName: string | null;
  pickupAddress: string;
  dropoffAddress: string;
  distanceMiles: number;
  basePayCents: number;
  tipCents: number;
  totalPayCents: number;
  itemCount: number;
  milesFromYou: number;
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [claiming, setClaiming] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch('/api/driver/jobs');
    if (res.ok) setJobs((await res.json()).jobs ?? []);
  };
  useEffect(() => {
    load();
    const t = setInterval(load, 10_000);
    return () => clearInterval(t);
  }, []);

  const claim = async (orderId: string) => {
    setClaiming(orderId);
    const res = await fetch(`/api/driver/jobs/${orderId}/claim`, { method: 'POST' });
    if (res.ok) {
      window.location.assign(`/driver/jobs/${orderId}`);
    } else {
      const j = await res.json();
      alert(j.error ?? 'Claim failed');
      await load();
    }
    setClaiming(null);
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

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        <h1 className="text-3xl font-bold">Available jobs</h1>
        {jobs.length === 0 ? (
          <p className="text-[var(--color-text-secondary)]">No jobs nearby. Stay online — new orders appear here automatically.</p>
        ) : (
          jobs.map((j) => (
            <Card key={j.orderId}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold">From {j.cookName}</h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {j.itemCount} item{j.itemCount === 1 ? '' : 's'} ·{' '}
                    {j.distanceMiles.toFixed(1)} mi to deliver
                  </p>
                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    {j.milesFromYou.toFixed(1)} mi from you
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-brand-400">
                    ${(j.totalPayCents / 100).toFixed(2)}
                  </div>
                  <div className="text-xs text-[var(--color-text-tertiary)]">
                    ${(j.basePayCents / 100).toFixed(2)} pay + ${(j.tipCents / 100).toFixed(2)} tip
                  </div>
                </div>
              </div>
              <Button
                className="w-full"
                onClick={() => claim(j.orderId)}
                disabled={claiming === j.orderId}
              >
                {claiming === j.orderId ? 'Claiming…' : 'Claim job'}
              </Button>
            </Card>
          ))
        )}
      </div>
    </main>
  );
}
