'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

type Dish = {
  id: string;
  name: string;
  description: string;
  photoUrl: string | null;
  priceCents: number;
  isActive: boolean;
  dishCategory: 'NON_TCS' | 'TCS';
};

export default function CookDishesPage() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const res = await fetch('/api/cook/dishes');
    if (res.ok) setDishes((await res.json()).dishes ?? []);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const removeDish = async (id: string) => {
    if (!confirm('Remove this dish?')) return;
    await fetch(`/api/cook/dishes/${id}`, { method: 'DELETE' });
    await load();
  };

  return (
    <main className="min-h-screen bg-[var(--color-surface-0)]">
      <header className="border-b bg-[var(--color-surface-1)]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between">
          <Link href="/cook" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
            ← Dashboard
          </Link>
          <Link href="/cook/dishes/new">
            <Button>+ New dish</Button>
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        <h1 className="text-3xl font-bold">Your dishes</h1>
        {loading ? (
          <p>Loading…</p>
        ) : dishes.length === 0 ? (
          <Card>
            <p className="text-[var(--color-text-secondary)]">No dishes yet. Add your first one.</p>
          </Card>
        ) : (
          dishes.map((d) => (
            <Card key={d.id} className="flex items-center gap-4">
              {d.photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={d.photoUrl} alt={d.name} className="w-20 h-20 rounded-md object-cover" />
              )}
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold">{d.name}</h3>
                  <span className="font-bold">${(d.priceCents / 100).toFixed(2)}</span>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2">{d.description}</p>
                <div className="flex gap-2 mt-1 text-xs">
                  <span className={d.isActive ? 'text-emerald-700' : 'text-[var(--color-text-tertiary)]'}>
                    {d.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-[var(--color-text-tertiary)]">·</span>
                  <span className="text-[var(--color-text-tertiary)]">{d.dishCategory}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Link href={`/cook/dishes/${d.id}`}>
                  <Button variant="secondary">Edit</Button>
                </Link>
                <Button variant="ghost" className="text-red-600" onClick={() => removeDish(d.id)}>
                  Remove
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </main>
  );
}
