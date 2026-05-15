import Link from 'next/link';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { Icon } from '@/components/ui/Icon';
import { PriceTag } from '@/components/ui/PriceTag';

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
    new URL(`/api/buyer/orders/${id}`, process.env.APP_URL ?? 'http://localhost:3001'),
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

  const isActive = !['DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUNDED', 'COOK_DECLINED'].includes(
    order.state,
  );

  return (
    <main className="cc-page cc-page-narrow">
      <Link href="/orders" className="cc-back">
        <Icon name="arrow-left" size={14} /> All orders
      </Link>

      <div className="cc-mono cc-muted" style={{ marginTop: 8 }}>
        #{id.slice(-8).toUpperCase()}
      </div>
      <h1 className="cc-page-title" style={{ marginTop: 4 }}>
        Order from {order.cook.name}
      </h1>

      {isActive && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 16px',
            border: '1px solid var(--accent)',
            borderRadius: 999,
            background: 'var(--accent-bg)',
            color: 'var(--accent)',
            fontSize: 13,
            fontWeight: 500,
            marginBottom: 24,
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--accent)' }} />
          {STATE_LABELS[order.state] ?? order.state}
        </div>
      )}

      {order.driver?.name && (
        <p style={{ fontSize: 14, color: 'var(--ink-2)', marginBottom: 24 }}>
          🛵 Driver: <strong>{order.driver.name}</strong>
        </p>
      )}

      {/* Timeline */}
      <section style={{ marginTop: 16, marginBottom: 32 }}>
        <h4
          style={{
            fontFamily: 'var(--f-mono)',
            fontSize: 11,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
            margin: '0 0 16px',
            fontWeight: 600,
          }}
        >
          Timeline
        </h4>
        <ol
          style={{
            listStyle: 'none',
            padding: '0 0 0 24px',
            margin: 0,
            borderLeft: '1px solid var(--line)',
          }}
        >
          {order.events.map((e, idx) => (
            <li key={e.id} style={{ position: 'relative', padding: '0 0 18px' }}>
              <span
                style={{
                  position: 'absolute',
                  left: -29,
                  top: 4,
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: idx === 0 ? 'var(--accent)' : 'var(--line)',
                  border: '2px solid var(--bg)',
                }}
              />
              <div style={{ fontWeight: 500 }}>
                {STATE_LABELS[e.toState] ?? e.toState}
              </div>
              <div
                className="cc-mono"
                style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}
              >
                {new Date(e.createdAt).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Items */}
      <section>
        <h4
          style={{
            fontFamily: 'var(--f-mono)',
            fontSize: 11,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
            margin: '0 0 16px',
            fontWeight: 600,
          }}
        >
          Items
        </h4>
        <dl className="cc-detail-list">
          {order.items.map((it) => (
            <div key={it.id} className="cc-detail-row">
              <dt>
                {it.quantity} × {it.dishNameSnapshot}
              </dt>
              <dd className="cc-mono">
                ${((it.unitPriceCents * it.quantity) / 100).toFixed(2)}
              </dd>
            </div>
          ))}
          <div className="cc-detail-row">
            <dt>Subtotal</dt>
            <dd className="cc-mono">${(order.subtotalCents / 100).toFixed(2)}</dd>
          </div>
          <div className="cc-detail-row">
            <dt>Service fee</dt>
            <dd className="cc-mono">${(order.buyerServiceFeeCents / 100).toFixed(2)}</dd>
          </div>
          <div className="cc-detail-row">
            <dt>Delivery</dt>
            <dd className="cc-mono">${(order.deliveryFeeCents / 100).toFixed(2)}</dd>
          </div>
          <div className="cc-detail-row">
            <dt>Driver tip</dt>
            <dd className="cc-mono">${(order.driverTipCents / 100).toFixed(2)}</dd>
          </div>
        </dl>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            paddingTop: 16,
            borderTop: '1px solid var(--line)',
            marginTop: 4,
          }}
        >
          <span style={{ fontFamily: 'var(--f-display)', fontSize: 20, fontWeight: 600 }}>
            Total
          </span>
          <PriceTag cents={order.totalChargedCents} large />
        </div>
      </section>
    </main>
  );
}
