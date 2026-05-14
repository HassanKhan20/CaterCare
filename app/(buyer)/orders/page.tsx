import Link from 'next/link';
import { headers } from 'next/headers';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

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
    new URL('/api/buyer/orders', process.env.APP_URL ?? 'http://localhost:3000'),
    { cache: 'no-store', headers: { cookie: cookieHeader } },
  );
  if (!res.ok) return [];
  return (await res.json()).orders ?? [];
}

export default async function OrdersListPage() {
  const orders = await fetchOrders();

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Your orders</h1>
          <Link href="/browse">
            <Button variant="secondary" size="sm">+ New order</Button>
          </Link>
        </div>

        {orders.length === 0 ? (
          <EmptyState
            icon="🛍️"
            title="No orders yet"
            description="Browse local cooks and place your first order."
            action={
              <Link href="/browse">
                <Button>Browse cooks</Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <Link key={o.id} href={`/orders/${o.id}`}>
                <Card className="hover:shadow-md hover:border-slate-300 transition-all cursor-pointer">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1.5 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">
                        From {o.cook.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(o.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <Badge state={o.state} />
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-slate-900">
                        ${(o.totalChargedCents / 100).toFixed(2)}
                      </p>
                      <p className="text-xs text-brand-600 mt-1">View →</p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
