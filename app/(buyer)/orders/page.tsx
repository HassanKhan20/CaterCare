import Link from 'next/link';
import { headers } from 'next/headers';
import { Card } from '@/components/ui/Card';

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
      <header className="border-b bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between">
          <Link href="/" className="text-xl font-bold text-brand-700">
            CaterCare
          </Link>
          <Link href="/browse" className="text-sm text-slate-600 hover:text-slate-900">
            Browse cooks
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        <h1 className="text-3xl font-bold">Your orders</h1>
        {orders.length === 0 ? (
          <p className="text-slate-600">No orders yet.</p>
        ) : (
          orders.map((o) => (
            <Link key={o.id} href={`/orders/${o.id}`}>
              <Card className="hover:shadow-md transition cursor-pointer">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">From {o.cook.name}</h3>
                    <p className="text-xs text-slate-500">
                      {new Date(o.createdAt).toLocaleString()}
                    </p>
                    <p className="text-sm mt-1">{o.state}</p>
                  </div>
                  <span className="font-medium">
                    ${(o.totalChargedCents / 100).toFixed(2)}
                  </span>
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}
