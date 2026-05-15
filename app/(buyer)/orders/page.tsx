import Link from 'next/link';
import { headers } from 'next/headers';
import { PriceTag } from '@/components/ui/PriceTag';

type Order = {
  id: string;
  state: string;
  totalChargedCents: number;
  createdAt: string;
  cook: { name: string | null };
};

async function fetchOrders(): Promise<Order[]> {
  const h = await headers();
  const cookieHeader = h.get('cookie') ?? '';
  const res = await fetch(
    new URL('/api/buyer/orders', process.env.APP_URL ?? 'http://localhost:3001'),
    { cache: 'no-store', headers: { cookie: cookieHeader } },
  );
  if (!res.ok) return [];
  return (await res.json()).orders ?? [];
}

const STATE_MAP: Record<string, { label: string; tone: 'ok' | 'warn' }> = {
  PLACED: { label: 'Placed', tone: 'warn' },
  COOK_ACCEPTED: { label: 'Accepted', tone: 'warn' },
  PREPARING: { label: 'Preparing', tone: 'warn' },
  READY_FOR_PICKUP: { label: 'Ready', tone: 'warn' },
  DRIVER_ASSIGNED: { label: 'On the way', tone: 'warn' },
  PICKED_UP: { label: 'On the way', tone: 'warn' },
  DELIVERED: { label: 'Delivered', tone: 'ok' },
  COMPLETED: { label: 'Completed', tone: 'ok' },
  CANCELLED: { label: 'Cancelled', tone: 'warn' },
  REFUNDED: { label: 'Refunded', tone: 'warn' },
  DRAFT: { label: 'Awaiting payment', tone: 'warn' },
  COOK_DECLINED: { label: 'Declined', tone: 'warn' },
};

export default async function OrdersListPage() {
  const orders = await fetchOrders();
  const monthSpend = orders.reduce((s, o) => s + o.totalChargedCents, 0);
  const cookCount = new Set(orders.map((o) => o.cook.name)).size;

  return (
    <main className="cc-page cc-page-narrow">
      <h1 className="cc-page-title">Your orders</h1>
      <p className="cc-page-sub">
        {orders.length} order{orders.length === 1 ? '' : 's'} · {cookCount} cook
        {cookCount === 1 ? '' : 's'} · ${(monthSpend / 100).toFixed(2)} spent
      </p>

      {orders.length === 0 ? (
        <p className="cc-muted">
          No orders yet.{' '}
          <Link href="/browse" className="cc-link-sm">
            Browse cooks →
          </Link>
        </p>
      ) : (
        <div className="cc-orders">
          {orders.map((o) => {
            const state = STATE_MAP[o.state] ?? { label: o.state, tone: 'warn' as const };
            return (
              <article key={o.id} className="cc-order">
                <div>
                  <div className="cc-mono cc-muted">
                    #{o.id.slice(-8).toUpperCase()} ·{' '}
                    {new Date(o.createdAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </div>
                  <h4>{o.cook.name}</h4>
                  <span className={`cc-state cc-state-${state.tone}`}>{state.label}</span>
                </div>
                <div className="cc-order-right">
                  <PriceTag cents={o.totalChargedCents} />
                  <Link href={`/orders/${o.id}`} className="cc-link-sm">
                    View →
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
