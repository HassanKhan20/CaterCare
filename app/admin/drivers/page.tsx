'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';

type DriverRow = {
  userId: string;
  docsStatus: string;
  backgroundCheckStatus: string;
  approvedAt: string | null;
  user: { name: string | null; email: string; status: string };
};

export default function AdminDriversPage() {
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'all'>('pending');

  const load = async () => {
    const res = await fetch(`/api/admin/drivers?status=${filter}`);
    if (res.ok) setDrivers((await res.json()).drivers ?? []);
  };
  useEffect(() => {
    queueMicrotask(load);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  return (
    <main className="min-h-screen bg-[var(--color-surface-0)]">
      <header className="border-b bg-[var(--color-surface-1)]">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <Link href="/admin" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
            ← Admin
          </Link>
        </div>
      </header>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
        <h1 className="text-3xl font-bold">Drivers</h1>
        <div className="flex gap-2">
          {(['pending', 'approved', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-sm capitalize ${
                filter === f ? 'bg-brand-400/150 text-white' : 'bg-[var(--color-surface-1)] border border-[var(--color-surface-3)]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        {drivers.length === 0 ? (
          <Card><p className="text-[var(--color-text-secondary)]">No drivers.</p></Card>
        ) : (
          drivers.map((d) => (
            <Link key={d.userId} href={`/admin/drivers/${d.userId}`}>
              <Card className="hover:shadow-md transition cursor-pointer">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold">{d.user.name}</h3>
                    <p className="text-sm text-[var(--color-text-secondary)]">{d.user.email}</p>
                  </div>
                  <div className="text-xs text-right space-y-1">
                    <div>Docs: {d.docsStatus}</div>
                    <div>BG check: {d.backgroundCheckStatus}</div>
                    {d.approvedAt && <div className="text-emerald-700">✓ Approved</div>}
                  </div>
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}
