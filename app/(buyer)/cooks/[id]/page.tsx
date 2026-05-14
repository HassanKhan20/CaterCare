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
      {/* Contextual back nav */}
      <div className="border-b bg-white">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <Link href="/browse" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
            ← All cooks
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Cook header */}
        <div className="flex gap-5 items-start">
          {cook.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cook.photoUrl}
              alt={cook.name ?? 'cook'}
              className="w-28 h-28 rounded-2xl object-cover shadow-sm shrink-0"
            />
          ) : (
            <div className="w-28 h-28 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700 text-4xl font-bold shrink-0">
              {(cook.name ?? '?').slice(0, 1)}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{cook.name}</h1>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {cook.cuisineTags.map((t) => (
                <span key={t} className="text-xs px-2 py-0.5 bg-brand-50 text-brand-800 rounded-full font-medium">
                  {t}
                </span>
              ))}
              {cook.neighborhood && (
                <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                  📍 {cook.neighborhood}
                </span>
              )}
            </div>
            {cook.story && (
              <p className="mt-3 text-slate-600 text-sm leading-relaxed max-w-prose">{cook.story}</p>
            )}
          </div>
        </div>

        {/* Menu */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            Menu · {cook.dishes.length} dish{cook.dishes.length === 1 ? '' : 'es'}
          </h2>
          {cook.dishes.length === 0 ? (
            <p className="text-slate-500 text-sm">No dishes yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cook.dishes.map((d) => (
                <Link key={d.id} href={`/dishes/${d.id}`}>
                  <Card className="hover:shadow-md hover:border-brand-200 transition-all cursor-pointer h-full">
                    <div className="flex gap-4">
                      {d.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={d.photoUrl}
                          alt={d.name}
                          className="w-20 h-20 rounded-xl object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center text-2xl shrink-0">
                          🍽️
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-semibold text-slate-900 leading-tight">{d.name}</h3>
                          <span className="font-bold text-brand-600 shrink-0">
                            ${(d.priceCents / 100).toFixed(2)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 line-clamp-2 mt-1">{d.description}</p>
                        {d.allergens.length > 0 && (
                          <p className="text-xs text-amber-700 mt-1.5">
                            Contains: {d.allergens.join(', ')}
                          </p>
                        )}
                        <p className="text-xs text-slate-400 mt-1">{d.leadTimeHours}h notice</p>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
