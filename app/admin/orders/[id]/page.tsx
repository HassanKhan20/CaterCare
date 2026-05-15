'use client';
import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

type OrderDetail = {
  id: string;
  state: string;
  totalChargedCents: number;
  cookPayoutCents: number;
  driverPayoutCents: number;
  platformRevenueCents: number;
  containsTcsItems: boolean;
  pickupAddressLine: string;
  deliveryAddressLine: string;
  buyerNote: string | null;
  cancellationReason: string | null;
  deliveredAt: string | null;
  cook: { name: string | null };
  buyer: { name: string | null };
  driver: { name: string | null } | null;
};

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<OrderDetail | null>(null);

  const load = async () => {
    // Re-use the admin orders list endpoint and find the matching row for v1
    const res = await fetch('/api/admin/orders');
    if (res.ok) {
      const o = ((await res.json()).orders ?? []).find((x: OrderDetail) => x.id === id);
      setOrder(o ?? null);
    }
  };
  useEffect(() => {
    load();
  }, [id]);

  const cancel = async () => {
    const reason = prompt('Cancel reason?');
    if (!reason) return;
    await fetch(`/api/admin/orders/${id}/cancel`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    await load();
  };
  const refund = async () => {
    if (!order) return;
    const willDecrement = order.deliveredAt && new Date(order.deliveredAt).getFullYear() === new Date().getFullYear();
    const ok = confirm(
      willDecrement
        ? `Refund $${(order.totalChargedCents / 100).toFixed(2)}? This will decrement cook's annual GMV by $${(order.cookPayoutCents / 100).toFixed(2)}.`
        : `Refund $${(order.totalChargedCents / 100).toFixed(2)}?`,
    );
    if (!ok) return;
    const reason = prompt('Refund reason?');
    if (!reason) return;
    await fetch(`/api/admin/orders/${id}/refund`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    await load();
  };
  const reassign = async () => {
    if (!confirm('Unassign current driver and put back on the open job feed?')) return;
    await fetch(`/api/admin/orders/${id}/reassign`, { method: 'POST' });
    await load();
  };

  if (!order) return <main className="p-8">Loading…</main>;

  return (
    <main className="min-h-screen bg-[var(--color-surface-0)]">
      <header className="border-b bg-[var(--color-surface-1)]">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/admin/orders" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
            ← Orders
          </Link>
        </div>
      </header>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Order {order.id.slice(0, 8)}</h1>
          <p className="text-[var(--color-text-secondary)]">Status: {order.state}</p>
        </div>

        <Card>
          <h2 className="font-semibold mb-2">Parties</h2>
          <p className="text-sm">Buyer: {order.buyer.name}</p>
          <p className="text-sm">Cook: {order.cook.name}</p>
          <p className="text-sm">Driver: {order.driver?.name ?? '—'}</p>
        </Card>

        <Card>
          <h2 className="font-semibold mb-2">Financials</h2>
          <div className="text-sm space-y-1">
            <Row label="Total charged" cents={order.totalChargedCents} />
            <Row label="Cook payout" cents={order.cookPayoutCents} />
            <Row label="Driver payout" cents={order.driverPayoutCents} />
            <Row label="Platform revenue" cents={order.platformRevenueCents} bold />
          </div>
          {order.containsTcsItems && (
            <p className="text-xs text-blue-300 mt-2">Contains TCS items.</p>
          )}
        </Card>

        <Card>
          <h2 className="font-semibold mb-2">Addresses</h2>
          <p className="text-sm">Pickup: {order.pickupAddressLine}</p>
          <p className="text-sm">Dropoff: {order.deliveryAddressLine}</p>
          {order.buyerNote && <p className="text-sm mt-2">Note: {order.buyerNote}</p>}
        </Card>

        <Card>
          <h2 className="font-semibold mb-2">Intervention</h2>
          <div className="flex gap-2 flex-wrap">
            {order.state !== 'CANCELLED' && order.state !== 'REFUNDED' && (
              <Button variant="danger" onClick={cancel}>Cancel order</Button>
            )}
            {order.state !== 'REFUNDED' && (
              <Button variant="danger" onClick={refund}>Refund</Button>
            )}
            {(order.state === 'DRIVER_ASSIGNED' || order.state === 'PICKED_UP') && (
              <Button variant="secondary" onClick={reassign}>Unassign driver</Button>
            )}
          </div>
          {order.cancellationReason && (
            <p className="text-xs text-[var(--color-text-tertiary)] mt-2">Reason: {order.cancellationReason}</p>
          )}
        </Card>
      </div>
    </main>
  );
}

function Row({ label, cents, bold }: { label: string; cents: number; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? 'font-bold pt-2 border-t' : ''}`}>
      <span className="text-[var(--color-text-secondary)]">{label}</span>
      <span>${(cents / 100).toFixed(2)}</span>
    </div>
  );
}
