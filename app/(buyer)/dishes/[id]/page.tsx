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
      <header className="border-b bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link
            href={`/cooks/${dish.cookId}`}
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            ← {dish.cookName}
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {dish.photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dish.photoUrl}
            alt={dish.name}
            className="w-full h-72 rounded-lg object-cover"
          />
        )}
        <div className="flex justify-between items-start">
          <h1 className="text-3xl font-bold">{dish.name}</h1>
          <span className="text-2xl font-bold text-brand-700">
            ${(dish.priceCents / 100).toFixed(2)}
          </span>
        </div>
        <p className="text-slate-700">{dish.description}</p>

        <Card className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Portion</span>
            <span>{dish.portionSize ?? '1 serving'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Allergens</span>
            <span>
              {dish.allergens.length > 0 ? dish.allergens.join(', ') : 'None disclosed'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Lead time</span>
            <span>{dish.leadTimeHours}h notice required</span>
          </div>
          {dish.dishCategory === 'TCS' && (
            <p className="text-xs text-slate-500 italic pt-2 border-t">
              This is a refrigerated/prepared meal (TCS). Cook is registered with TX
              DSHS.
            </p>
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
