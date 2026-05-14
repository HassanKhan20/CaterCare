'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';

type Order = {
  id: string;
  state: string;
  subtotalCents: number;
  cookPayoutCents: number;
  buyer: { name: string | null };
  items: { quantity: number; dish: { name: string } }[];
  createdAt: string;
};

const STATE_FILTERS: { label: string; states: string[] | null }[] = [
  { label: 'New', states: ['PLACED'] },
  { label: 'In progress', states: ['COOK_ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP'] },
  { label: 'Out for delivery', states: ['DRIVER_ASSIGNED', 'PICKED_UP'] },
  { label: 'Completed', states: ['DELIVERED', 'COMPLETED'] },
  { label: 'All', states: null },
];

export default function CookOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string[] | null>(['PLACED']);

  const load = async () => {
    const res = await fetch('/api/cook/orders');
    if (res.ok) setOrders((await res.json()).orders ?? []);
  };
  useEffect(() => {
    load();
    const t = setInterval(load, 15_000);
    return () => clearInterval(t);
  }, []);

  const visible = filter ? orders.filter((o) => filter.includes(o.state)) : orders;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/cook" className="text-sm text-slate-600 hover:text-slate-900">
            ← Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        <h1 className="text-3xl font-bold">Orders</h1>
        <div className="flex gap-2 overflow-x-auto">
          {STATE_FILTERS.map((f) => (
            <button
              key={f.label}
              onClick={() => setFilter(f.states)}
              className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                JSON.stringify(filter) === JSON.stringify(f.states)
                  ? 'bg-brand-500 text-white'
                  : 'bg-white border border-slate-300 text-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <Card>
            <p className="text-slate-600">No orders match this filter.</p>
          </Card>
        ) : (
          visible.map((o) => (
            <Link key={o.id} href={`/cook/orders/${o.id}`}>
              <Card className="hover:shadow-md transition cursor-pointer">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{o.buyer.name}</h3>
                    <p className="text-sm text-slate-600">
                      {o.items.map((i) => `${i.quantity}× ${i.dish.name}`).join(', ')}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(o.createdAt).toLocaleString()} · {o.state}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">${(o.cookPayoutCents / 100).toFixed(2)}</div>
                    <div className="text-xs text-slate-500">your earnings</div>
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
