'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';

type CookRow = {
  userId: string;
  story: string | null;
  neighborhood: string | null;
  cuisineTags: string[];
  idStatus: string;
  foodHandlerCertStatus: string;
  dshsRegistrationStatus: string;
  approvedAt: string | null;
  user: { name: string | null; email: string };
};

export default function AdminCooksPage() {
  const [cooks, setCooks] = useState<CookRow[]>([]);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'all'>('pending');

  const load = async () => {
    const res = await fetch(`/api/admin/cooks?status=${filter}`);
    if (res.ok) setCooks((await res.json()).cooks ?? []);
  };
  useEffect(() => {
    load();
  }, [filter]);

  return (
    <main className="min-h-screen bg-[var(--color-surface-0)]">
      <header className="border-b bg-[var(--color-surface-1)]">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <Link href="/admin" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
            ← Admin dashboard
          </Link>
        </div>
      </header>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
        <h1 className="text-3xl font-bold">Cooks</h1>
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
        {cooks.length === 0 ? (
          <Card><p className="text-[var(--color-text-secondary)]">No cooks match this filter.</p></Card>
        ) : (
          cooks.map((c) => (
            <Link key={c.userId} href={`/admin/cooks/${c.userId}`}>
              <Card className="hover:shadow-md transition cursor-pointer">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold">{c.user.name}</h3>
                    <p className="text-sm text-[var(--color-text-secondary)]">{c.user.email}</p>
                    <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                      {c.neighborhood} · {c.cuisineTags.join(', ')}
                    </p>
                  </div>
                  <div className="text-xs space-y-1 text-right">
                    <StatusBadge label="ID" status={c.idStatus} />
                    <StatusBadge label="Cert" status={c.foodHandlerCertStatus} />
                    <StatusBadge label="DSHS" status={c.dshsRegistrationStatus} />
                    {c.approvedAt && <span className="text-emerald-300 block">✓ Approved</span>}
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

function StatusBadge({ label, status }: { label: string; status: string }) {
  const color =
    status === 'APPROVED'
      ? 'text-emerald-300'
      : status === 'PENDING'
        ? 'text-amber-300'
        : status === 'REJECTED'
          ? 'text-red-300'
          : 'text-[var(--color-text-tertiary)]';
  return (
    <div className={color}>
      {label}: {status}
    </div>
  );
}
