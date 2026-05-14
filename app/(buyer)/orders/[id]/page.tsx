import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';

const STATE_LABELS: Record<string, string> = {
  DRAFT: 'Awaiting payment',
  PLACED: 'Order placed',
  COOK_ACCEPTED: 'Cook accepted',
  COOK_DECLINED: 'Cook declined',
  PREPARING: 'Cook preparing',
  READY_FOR_PICKUP: 'Ready for pickup',
  DRIVER_ASSIGNED: 'Driver assigned',
  PICKED_UP: 'Driver picked up',
  DELIVERED: 'Delivered',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
};

async function fetchOrder(id: string) {
  const h = await headers();
  const cookieHeader = h.get('cookie') ?? '';
  const res = await fetch(
    new URL(`/api/buyer/orders/${id}`, process.env.APP_URL ?? 'http://localhost:3000'),
    { cache: 'no-store', headers: { cookie: cookieHeader } },
  );
  if (!res.ok) return null;
  return (await res.json()).order;
}

type OrderEvent = { id: string; toState: string; createdAt: string; note: string | null };
type OrderItem = {
  id: string;
  dishNameSnapshot: string;
  quantity: number;
  unitPriceCents: number;
  dish: { photoUrl: string | null };
};
type Order = {
  id: string;
  state: string;
  subtotalCents: number;
  buyerServiceFeeCents: number;
  deliveryFeeCents: number;
  driverTipCents: number;
  totalChargedCents: number;
  cook: { name: string | null };
  driver: { name: string | null } | null;
  items: OrderItem[];
  events: OrderEvent[];
};

export default async function OrderTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = (await fetchOrder(id)) as Order | null;
  if (!order) notFound();

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/orders" className="text-sm text-slate-600 hover:text-slate-900">
            ← All orders
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Order from {order.cook.name}</h1>
          <p className="text-slate-600 mt-1">
            Status: <strong>{STATE_LABELS[order.state] ?? order.state}</strong>
          </p>
        </div>

        <Card className="space-y-3">
          <h2 className="font-semibold">Timeline</h2>
          <ol className="space-y-2">
            {order.events.map((e) => (
              <li key={e.id} className="flex items-start gap-3 text-sm">
                <span className="text-brand-700">●</span>
                <div>
                  <div className="font-medium">{STATE_LABELS[e.toState] ?? e.toState}</div>
                  <div className="text-xs text-slate-500">
                    {new Date(e.createdAt).toLocaleString()}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <Card className="space-y-2">
          <h2 className="font-semibold">Items</h2>
          {order.items.map((it) => (
            <div key={it.id} className="flex justify-between text-sm">
              <span>
                {it.quantity} × {it.dishNameSnapshot}
              </span>
              <span>${((it.unitPriceCents * it.quantity) / 100).toFixed(2)}</span>
            </div>
          ))}
          <div className="pt-2 border-t space-y-1">
            <Row label="Subtotal" cents={order.subtotalCents} />
            <Row label="Service fee" cents={order.buyerServiceFeeCents} />
            <Row label="Delivery" cents={order.deliveryFeeCents} />
            <Row label="Driver tip" cents={order.driverTipCents} />
            <div className="flex justify-between font-bold pt-2 border-t">
              <span>Total</span>
              <span>${(order.totalChargedCents / 100).toFixed(2)}</span>
            </div>
          </div>
        </Card>

        {order.driver?.name && (
          <Card>
            <p className="text-sm">
              Your driver: <strong>{order.driver.name}</strong>
            </p>
          </Card>
        )}
      </div>
    </main>
  );
}

function Row({ label, cents }: { label: string; cents: number }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-600">{label}</span>
      <span>${(cents / 100).toFixed(2)}</span>
    </div>
  );
}
