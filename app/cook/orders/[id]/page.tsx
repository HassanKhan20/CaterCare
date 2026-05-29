'use client';
import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

type OrderDetail = {
  id: string;
  state: string;
  cookPayoutCents: number;
  buyerNote: string | null;
  pickupAddressLine: string;
  deliveryAddressLine: string;
  containsTcsItems: boolean;
  buyer: { name: string | null };
  items: { id: string; quantity: number; dishNameSnapshot: string; unitPriceCents: number }[];
};

const NEXT_LABEL: Record<string, { to: string; label: string }> = {
  PLACED: { to: 'COOK_ACCEPTED', label: 'Accept order' },
  COOK_ACCEPTED: { to: 'PREPARING', label: 'Start preparing' },
  PREPARING: { to: 'READY_FOR_PICKUP', label: 'Mark ready for pickup' },
};

export default function CookOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const res = await fetch(`/api/cook/orders/${id}`);
    if (res.ok) setOrder((await res.json()).order);
  };
  useEffect(() => {
    queueMicrotask(load);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const transition = async (to: string) => {
    setSubmitting(true);
    const res = await fetch(`/api/cook/orders/${id}/transition`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ to }),
    });
    if (res.ok) {
      await load();
    } else {
      const j = await res.json();
      alert(j.error ?? 'Failed');
    }
    setSubmitting(false);
  };

  const decline = async () => {
    if (!confirm('Decline this order? Buyer will be refunded.')) return;
    setSubmitting(true);
    await fetch(`/api/cook/orders/${id}/transition`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ to: 'COOK_DECLINED' }),
    });
    router.push('/cook/orders');
  };

  if (!order) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Loading…</p>
      </main>
    );
  }

  const nextStep = NEXT_LABEL[order.state];

  return (
    <main className="min-h-screen bg-[var(--color-surface-0)]">
      <header className="border-b bg-[var(--color-surface-1)]">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/cook/orders" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
            ← Orders
          </Link>
        </div>
      </header>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Order from {order.buyer.name}</h1>
          <p className="text-[var(--color-text-secondary)]">Status: {order.state}</p>
        </div>

        <Card>
          <div className="text-2xl font-bold text-brand-400 mb-1">
            ${(order.cookPayoutCents / 100).toFixed(2)}
          </div>
          <p className="text-xs text-[var(--color-text-tertiary)]">your payout after 11% commission</p>
        </Card>

        {order.containsTcsItems && (
          <Card className="bg-blue-500/15 border-blue-200 text-sm">
            <strong>TCS items.</strong> Keep refrigerated until pickup. Driver will use
            insulated bag.
          </Card>
        )}

        {order.buyerNote && (
          <Card className="bg-amber-500/10 border-amber-500/30 text-sm">
            <strong>Buyer note:</strong> {order.buyerNote}
          </Card>
        )}

        <Card>
          <h2 className="font-semibold mb-2">Prep sheet</h2>
          <ul className="text-sm space-y-1">
            {order.items.map((it) => (
              <li key={it.id} className="flex justify-between">
                <span>
                  <strong>{it.quantity}×</strong> {it.dishNameSnapshot}
                </span>
                <span className="text-[var(--color-text-tertiary)]">
                  ${((it.unitPriceCents * it.quantity) / 100).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="font-semibold mb-2">Delivery</h2>
          <p className="text-sm">{order.deliveryAddressLine}</p>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
            A driver will pick up from your address once you mark this ready.
          </p>
        </Card>

        <div className="flex gap-3">
          {nextStep && (
            <Button onClick={() => transition(nextStep.to)} disabled={submitting} className="flex-1">
              {submitting ? '…' : nextStep.label}
            </Button>
          )}
          {order.state === 'PLACED' && (
            <Button variant="danger" onClick={decline} disabled={submitting}>
              Decline
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
