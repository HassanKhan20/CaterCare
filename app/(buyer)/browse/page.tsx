import { CookCard } from '@/components/buyer/CookCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
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
  return (await res.json()).cooks ?? [];
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
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Cooks near you</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {cooks.length} approved cook{cooks.length === 1 ? '' : 's'} within 10 miles
          </p>
        </div>

        {cooks.length === 0 ? (
          <EmptyState
            icon="🍳"
            title="No cooks in your area yet"
            description="We're growing fast. Check back soon or invite a cook in your neighborhood."
            action={
              <Link href="/">
                <Button variant="secondary">Back to home</Button>
              </Link>
            }
          />
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
