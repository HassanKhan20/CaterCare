import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { AddToCartButton } from '@/components/buyer/AddToCartButton';

type Dish = {
  id: string;
  cookId: string;
  cookName: string;
  name: string;
  description: string;
  photoUrl: string | null;
  priceCents: number;
  portionSize: string | null;
  allergens: string[];
  leadTimeHours: number;
  dishCategory: 'NON_TCS' | 'TCS';
};

async function fetchDish(id: string): Promise<Dish | null> {
  const res = await fetch(
    new URL(`/api/public/dishes/${id}`, process.env.APP_URL ?? 'http://localhost:3000'),
    { cache: 'no-store' },
  );
  if (!res.ok) return null;
  return (await res.json()).dish;
}

export default async function DishPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dish = await fetchDish(id);
  if (!dish) notFound();

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Contextual back nav */}
      <div className="border-b bg-white">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <Link
            href={`/cooks/${dish.cookId}`}
            className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
          >
            ← {dish.cookName}
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {dish.photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dish.photoUrl}
            alt={dish.name}
            className="w-full h-72 rounded-2xl object-cover shadow-sm"
          />
        )}

        <div className="flex justify-between items-start gap-4">
          <h1 className="text-3xl font-bold text-slate-900">{dish.name}</h1>
          <span className="text-2xl font-bold text-brand-600 shrink-0">
            ${(dish.priceCents / 100).toFixed(2)}
          </span>
        </div>

        <p className="text-slate-600 leading-relaxed">{dish.description}</p>

        <Card className="divide-y divide-slate-100">
          <DetailRow label="Portion" value={dish.portionSize ?? '1 serving'} />
          <DetailRow
            label="Allergens"
            value={dish.allergens.length > 0 ? dish.allergens.join(', ') : 'None disclosed'}
          />
          <DetailRow label="Lead time" value={`${dish.leadTimeHours}h notice required`} />
          {dish.dishCategory === 'TCS' && (
            <div className="pt-3 text-xs text-slate-500 italic">
              Refrigerated/prepared meal (TCS) — cook is registered with TX DSHS.
            </div>
          )}
        </Card>

        <AddToCartButton
          cookId={dish.cookId}
          cookName={dish.cookName}
          dishId={dish.id}
          name={dish.name}
          priceCents={dish.priceCents}
          photoUrl={dish.photoUrl}
        />
      </div>
    </main>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-900 font-medium">{value}</span>
    </div>
  );
}
