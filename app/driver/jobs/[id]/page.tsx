'use client';
import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

type OrderItem = { id: string; dishNameSnapshot: string; quantity: number };
type OrderDetail = {
  id: string;
  state: string;
  pickupAddressLine: string;
  deliveryAddressLine: string;
  driverBasePayCents: number;
  driverTipCents: number;
  driverPayoutCents: number;
  buyerNote: string | null;
  containsTcsItems: boolean;
  items: OrderItem[];
  cook: { name: string | null };
};

export default function DriverJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    // Use buyer's order endpoint? No — driver needs their own view.
    // For v1, reuse the buyer endpoint logic via a server-side cookie passthrough is overkill;
    // simpler: read directly from the orders list filtered to this driver's claimed order.
    const res = await fetch('/api/driver/jobs');
    if (res.ok) {
      // Job is no longer on the open feed once claimed; fetch via direct query
    }
    // Fallback: hit a direct order detail (we'll use the admin-shaped endpoint via the buyer
    // tracking page, but drivers shouldn't see buyer-only info). For v1 we use a tiny
    // dedicated endpoint inline — or just refetch from a minimal route.
    const detailRes = await fetch(`/api/driver/orders/${id}`);
    if (detailRes.ok) setOrder((await detailRes.json()).order);
  };

  useEffect(() => {
    load();
  }, []);

  const transition = async (to: 'PICKED_UP' | 'DELIVERED') => {
    if (!order) return;
    setSubmitting(true);
    // For v1: skip photo capture, use placeholder. In production, presign + upload first.
    const photoUrl = 'https://placehold.co/600x400';
    const res = await fetch(`/api/driver/jobs/${id}/transition`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ to, photoUrl }),
    });
    if (res.ok) {
      if (to === 'DELIVERED') {
        router.push('/driver/earnings');
      } else {
        await load();
      }
    } else {
      const j = await res.json();
      alert(j.error ?? 'Failed');
    }
    setSubmitting(false);
  };

  if (!order) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Loading…</p>
      </main>
    );
  }

  const isPickedUp = order.state === 'PICKED_UP';
  const isAssigned = order.state === 'DRIVER_ASSIGNED';

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/driver/jobs" className="text-sm text-slate-600 hover:text-slate-900">
            ← Jobs
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Job: {order.cook.name}</h1>
          <p className="text-slate-600">Status: {order.state}</p>
        </div>

        <Card>
          <div className="text-lg font-bold text-brand-700 mb-2">
            ${(order.driverPayoutCents / 100).toFixed(2)} total
          </div>
          <p className="text-sm text-slate-600">
            ${(order.driverBasePayCents / 100).toFixed(2)} base + $
            {(order.driverTipCents / 100).toFixed(2)} tip
          </p>
        </Card>

        <Card>
          <h2 className="font-semibold mb-2">
            {isAssigned ? '1. Pick up from' : '2. Deliver to'}
          </h2>
          <p className="text-sm">
            {isAssigned ? order.pickupAddressLine : order.deliveryAddressLine}
          </p>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
              isAssigned ? order.pickupAddressLine : order.deliveryAddressLine,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 text-brand-700 underline text-sm"
          >
            Open in Google Maps →
          </a>
        </Card>

        {order.buyerNote && (
          <Card className="bg-amber-50 border-amber-200">
            <p className="text-sm">
              <strong>Buyer note:</strong> {order.buyerNote}
            </p>
          </Card>
        )}

        {order.containsTcsItems && (
          <Card className="bg-blue-50 border-blue-200 text-sm">
            <strong>TCS items in this order.</strong> Keep food in your thermal bag — do not
            leave at door, hand to recipient.
          </Card>
        )}

        <Card>
          <h3 className="font-semibold mb-2">Items</h3>
          <ul className="text-sm space-y-1">
            {order.items.map((it) => (
              <li key={it.id}>
                {it.quantity} × {it.dishNameSnapshot}
              </li>
            ))}
          </ul>
        </Card>

        {isAssigned && (
          <Button
            className="w-full"
            onClick={() => transition('PICKED_UP')}
            disabled={submitting}
          >
            {submitting ? '…' : 'Confirm pickup'}
          </Button>
        )}
        {isPickedUp && (
          <Button
            className="w-full"
            onClick={() => transition('DELIVERED')}
            disabled={submitting}
          >
            {submitting ? '…' : 'Confirm delivery'}
          </Button>
        )}
      </div>
    </main>
  );
}
