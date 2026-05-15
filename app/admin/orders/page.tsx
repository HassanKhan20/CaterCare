'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';

type OrderRow = {
  id: string;
  state: string;
  totalChargedCents: number;
  createdAt: string;
  cook: { name: string | null };
  buyer: { name: string | null };
  driver: { name: string | null } | null;
};

const STATES = [
  null,
  'PLACED',
  'COOK_ACCEPTED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'DRIVER_ASSIGNED',
  'PICKED_UP',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
  'REFUNDED',
] as const;

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [state, setState] = useState<string | null>(null);

  useEffect(() => {
    const url = state ? `/api/admin/orders?state=${state}` : '/api/admin/orders';
    fetch(url)
      .then((r) => r.json())
      .then((j) => setOrders(j.orders ?? []));
  }, [state]);

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
        <h1 className="text-3xl font-bold">Orders</h1>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {STATES.map((s) => (
            <button
              key={s ?? 'all'}
              onClick={() => setState(s)}
              className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${
                state === s ? 'bg-brand-400/150 text-white' : 'bg-[var(--color-surface-1)] border border-[var(--color-surface-3)]'
              }`}
            >
              {s ?? 'All'}
            </button>
          ))}
        </div>
        {orders.length === 0 ? (
          <Card><p className="text-[var(--color-text-secondary)]">No orders match.</p></Card>
        ) : (
          orders.map((o) => (
            <Link key={o.id} href={`/admin/orders/${o.id}`}>
              <Card className="hover:shadow-md transition cursor-pointer">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">
                      {o.buyer.name} → {o.cook.name}
                      {o.driver?.name && ` (driver: ${o.driver.name})`}
                    </h3>
                    <p className="text-xs text-[var(--color-text-tertiary)]">
                      {new Date(o.createdAt).toLocaleString()} · <strong>{o.state}</strong>
                    </p>
                  </div>
                  <span className="font-medium">${(o.totalChargedCents / 100).toFixed(2)}</span>
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}
