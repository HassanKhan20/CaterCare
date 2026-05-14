import { CookCard } from '@/components/buyer/CookCard';
import Link from 'next/link';

type Cook = {
  id: string;
  name: string | null;
  photoUrl: string | null;
  story: string | null;
  cuisineTags: string[];
  neighborhood: string | null;
  distanceMiles: number;
  dishCount: number;
};

async function fetchCooks(lat: number, lng: number, cuisine?: string): Promise<Cook[]> {
  const url = new URL('/api/public/cooks', process.env.APP_URL ?? 'http://localhost:3000');
  url.searchParams.set('lat', lat.toString());
  url.searchParams.set('lng', lng.toString());
  url.searchParams.set('radius', '10');
  if (cuisine) url.searchParams.set('cuisine', cuisine);
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return [];
  const json = await res.json();
  return json.cooks ?? [];
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ lat?: string; lng?: string; cuisine?: string }>;
}) {
  const params = await searchParams;
  const lat = parseFloat(params.lat ?? '33.0738');
  const lng = parseFloat(params.lng ?? '-96.7480');
  const cuisine = params.cuisine;

  const cooks = await fetchCooks(lat, lng, cuisine);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-brand-700">
            CaterCare
          </Link>
          <Link href="/account" className="text-sm text-slate-600 hover:text-slate-900">
            Account
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Cooks near you</h1>
        <p className="text-slate-600 mb-6">{cooks.length} approved cooks within 10 miles</p>

        {cooks.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            No cooks in your area yet. Check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cooks.map((c) => (
              <CookCard key={c.id} cook={c} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
