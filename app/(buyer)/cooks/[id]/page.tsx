import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { notFound } from 'next/navigation';

type Dish = {
  id: string;
  name: string;
  description: string;
  photoUrl: string | null;
  priceCents: number;
  portionSize: string | null;
  allergens: string[];
  leadTimeHours: number;
  dishCategory: 'NON_TCS' | 'TCS';
};

type Cook = {
  id: string;
  name: string | null;
  photoUrl: string | null;
  story: string | null;
  cuisineTags: string[];
  neighborhood: string | null;
  dishes: Dish[];
};

async function fetchCook(id: string): Promise<Cook | null> {
  const res = await fetch(
    new URL(`/api/public/cooks/${id}`, process.env.APP_URL ?? 'http://localhost:3000'),
    { cache: 'no-store' },
  );
  if (!res.ok) return null;
  return (await res.json()).cook;
}

export default async function CookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cook = await fetchCook(id);
  if (!cook) notFound();

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/browse" className="text-sm text-slate-600 hover:text-slate-900">
            ← All cooks
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div className="flex gap-6 items-start">
          {cook.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cook.photoUrl}
              alt={cook.name ?? 'cook'}
              className="w-32 h-32 rounded-full object-cover"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-3xl font-bold">
              {(cook.name ?? '?').slice(0, 1)}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold">{cook.name}</h1>
            <p className="text-slate-600">
              {cook.cuisineTags.join(' · ')} · {cook.neighborhood}
            </p>
            {cook.story && <p className="mt-3 text-slate-700">{cook.story}</p>}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Menu</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cook.dishes.map((d) => (
              <Link key={d.id} href={`/dishes/${d.id}`}>
                <Card className="hover:shadow-md transition cursor-pointer h-full">
                  <div className="flex gap-3">
                    {d.photoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={d.photoUrl}
                        alt={d.name}
                        className="w-20 h-20 rounded-md object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold">{d.name}</h3>
                        <span className="font-bold text-brand-700">
                          ${(d.priceCents / 100).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2 mt-1">
                        {d.description}
                      </p>
                      {d.allergens.length > 0 && (
                        <p className="text-xs text-amber-700 mt-1">
                          Contains: {d.allergens.join(', ')}
                        </p>
                      )}
                      <p className="text-xs text-slate-500 mt-1">
                        Order {d.leadTimeHours}h ahead
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
