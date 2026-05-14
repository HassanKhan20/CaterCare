'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

type Dish = {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  isActive: boolean;
};

export default function EditDishPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [dish, setDish] = useState<Dish | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/cook/dishes')
      .then((r) => r.json())
      .then((j) => {
        const found = (j.dishes ?? []).find((d: Dish) => d.id === id);
        setDish(found ?? null);
      });
  }, [id]);

  const save = async () => {
    if (!dish) return;
    setSubmitting(true);
    await fetch(`/api/cook/dishes/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: dish.name,
        description: dish.description,
        priceCents: dish.priceCents,
        isActive: dish.isActive,
      }),
    });
    setSubmitting(false);
    router.push('/cook/dishes');
  };

  if (!dish) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Loading…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/cook/dishes" className="text-sm text-slate-600 hover:text-slate-900">
            ← Dishes
          </Link>
        </div>
      </header>
      <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-3xl font-bold">Edit dish</h1>
        <Card className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <Input value={dish.name} onChange={(e) => setDish({ ...dish, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={dish.description}
              onChange={(e) => setDish({ ...dish, description: e.target.value })}
              className="w-full px-3 py-2 rounded-md border border-slate-300"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Price ($)</label>
            <Input
              type="number"
              step="0.01"
              value={(dish.priceCents / 100).toFixed(2)}
              onChange={(e) =>
                setDish({ ...dish, priceCents: Math.round(parseFloat(e.target.value) * 100) })
              }
            />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={dish.isActive}
              onChange={(e) => setDish({ ...dish, isActive: e.target.checked })}
            />
            <span className="text-sm">Active (visible to buyers)</span>
          </label>
        </Card>
        <Button className="w-full" onClick={save} disabled={submitting}>
          {submitting ? '…' : 'Save changes'}
        </Button>
      </div>
    </main>
  );
}
