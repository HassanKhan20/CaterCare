import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';

const STATE_LABELS: Record<string, string> = {
  DRAFT: 'Awaiting payment',
  PLACED: 'Order placed',
  COOK_ACCEPTED: 'Cook accepted',
  COOK_DECLINED: 'Cook declined',
  PREPARING: 'Cook is preparing',
  READY_FOR_PICKUP: 'Ready for pickup',
  DRIVER_ASSIGNED: 'Driver assigned',
  PICKED_UP: 'On the way',
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

  const isActive = !['DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUNDED', 'COOK_DECLINED'].includes(order.state);

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Contextual back nav */}
      <div className="border-b bg-white">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <Link href="/orders" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
            ← All orders
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Order from {order.cook.name}
            </h1>
            <p className="text-sm text-slate-500 mt-1">#{id.slice(-8).toUpperCase()}</p>
          </div>
          <Badge state={order.state} className="mt-1 shrink-0" />
        </div>

        {/* Live status strip */}
        {isActive && (
          <div className="rounded-xl bg-brand-50 border border-brand-200 px-4 py-3 flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-500" />
            </span>
            <p className="text-sm font-medium text-brand-800">
              {STATE_LABELS[order.state] ?? order.state}
            </p>
          </div>
        )}

        {/* Driver */}
        {order.driver?.name && (
          <Card className="flex items-center gap-3 py-3 px-4">
            <span className="text-xl">🛵</span>
            <div>
              <p className="text-xs text-slate-500">Your driver</p>
              <p className="font-semibold text-slate-900">{order.driver.name}</p>
            </div>
          </Card>
        )}

        {/* Timeline */}
        <Card className="space-y-1 py-5">
          <h2 className="font-semibold text-slate-800 mb-3 px-1">Timeline</h2>
          <ol className="relative ml-3 border-l border-slate-200 space-y-4 pl-6">
            {order.events.map((e, idx) => (
              <li key={e.id} className="relative">
                <div className={`absolute -left-[1.65rem] w-3 h-3 rounded-full border-2 border-white ${idx === 0 ? 'bg-brand-500' : 'bg-slate-300'}`} />
                <div className="font-medium text-sm text-slate-900">
                  {STATE_LABELS[e.toState] ?? e.toState}
                </div>
                <div className="text-xs text-slate-500">
                  {new Date(e.createdAt).toLocaleString('en-US', {
                    month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </div>
              </li>
            ))}
          </ol>
        </Card>

        {/* Items */}
        <Card className="space-y-3">
          <h2 className="font-semibold text-slate-800">Items</h2>
          <div className="space-y-2">
            {order.items.map((it) => (
              <div key={it.id} className="flex items-center gap-3">
                {it.dish?.photoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={it.dish.photoUrl}
                    alt={it.dishNameSnapshot}
                    className="w-10 h-10 rounded-md object-cover"
                  />
                )}
                <span className="flex-1 text-sm text-slate-700">
                  {it.quantity} × {it.dishNameSnapshot}
                </span>
                <span className="text-sm font-medium">
                  ${((it.unitPriceCents * it.quantity) / 100).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t space-y-1.5">
            <Row label="Subtotal" cents={order.subtotalCents} />
            <Row label="Service fee" cents={order.buyerServiceFeeCents} />
            <Row label="Delivery" cents={order.deliveryFeeCents} />
            <Row label="Driver tip" cents={order.driverTipCents} />
            <div className="flex justify-between font-bold pt-2 border-t text-slate-900">
              <span>Total</span>
              <span>${(order.totalChargedCents / 100).toFixed(2)}</span>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}

function Row({ label, cents }: { label: string; cents: number }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-900">${(cents / 100).toFixed(2)}</span>
    </div>
  );
}
