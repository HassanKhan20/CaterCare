import { CookCard } from '@/components/buyer/CookCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { BuyerNavBar } from '@/components/BuyerNavBar';
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
  const url = new URL(
    '/api/public/cooks',
    process.env.APP_URL ?? 'http://localhost:3001',
  );
  url.searchParams.set('lat', lat.toString());
  url.searchParams.set('lng', lng.toString());
  url.searchParams.set('radius', '10');
  if (cuisine) url.searchParams.set('cuisine', cuisine);
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return [];
  return (await res.json()).cooks ?? [];
}

const CUISINE_TABS = ['All', 'Pakistani', 'Mexican', 'Ethiopian', 'Indian', 'Vietnamese'];

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
    <main className="min-h-screen bg-[var(--color-surface-0)]">
      <BuyerNavBar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">
            What sounds good <span className="text-brand-400">today</span>?
          </h1>
          <p className="text-[#f5f1ec]/50 mt-2">
            {cooks.length} home cook{cooks.length === 1 ? '' : 's'} within 10 miles
          </p>
        </div>

        {/* Cuisine tabs */}
        <div className="mb-8 flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          {CUISINE_TABS.map((tab) => {
            const isActive = tab === 'All' ? !cuisine : cuisine === tab;
            const href =
              tab === 'All'
                ? `/browse?lat=${lat}&lng=${lng}`
                : `/browse?lat=${lat}&lng=${lng}&cuisine=${encodeURIComponent(tab)}`;
            return (
              <Link
                key={tab}
                href={href}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-brand-400 text-[#1a1715]'
                    : 'bg-[var(--color-surface-1)] text-[#f5f1ec]/70 hover:text-[#f5f1ec] border border-[var(--color-surface-3)]'
                }`}
              >
                {tab}
              </Link>
            );
          })}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {cooks.map((c) => (
              <CookCard key={c.id} cook={c} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
