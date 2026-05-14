import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AddToCartButton } from '@/components/buyer/AddToCartButton';
import { TimeChip } from '@/components/ui/TimeChip';
import { Chip } from '@/components/ui/Chip';

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
    new URL(`/api/public/dishes/${id}`, process.env.APP_URL ?? 'http://localhost:3001'),
    { cache: 'no-store' },
  );
  if (!res.ok) return null;
  return (await res.json()).dish;
}

function placeholderFor(id: string): string {
  const photos = [
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
    'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&q=80',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return photos[Math.abs(hash) % photos.length];
}

export default async function DishPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dish = await fetchDish(id);
  if (!dish) notFound();

  const img = dish.photoUrl ?? placeholderFor(dish.id);

  return (
    <main className="min-h-screen bg-[var(--color-surface-0)]">
      {/* Hero photo with floating back + favorite */}
      <div className="relative">
        <div className="h-[420px] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} alt={dish.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-surface-0)]/60 via-transparent to-[var(--color-surface-0)]" />
        </div>
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
          <Link
            href={`/cooks/${dish.cookId}`}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white hover:bg-black/60 transition-colors"
            aria-label="Back to cook"
          >
            ←
          </Link>
          <button
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white hover:bg-black/60 transition-colors"
            aria-label="Favorite"
          >
            ♡
          </button>
        </div>
        <div className="absolute bottom-6 left-6">
          <TimeChip hours={dish.leadTimeHours} />
        </div>
      </div>

      {/* Content panel */}
      <div className="max-w-3xl mx-auto px-6 -mt-12 relative pb-32">
        <div className="rounded-3xl bg-[var(--color-surface-1)] border border-[var(--color-surface-3)] p-7 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-[#f5f1ec]/40 uppercase tracking-wider mb-1">
                by {dish.cookName}
              </p>
              <h1 className="text-3xl font-bold tracking-tight">{dish.name}</h1>
            </div>
            <span className="text-3xl font-bold text-brand-400 shrink-0">
              ${(dish.priceCents / 100).toFixed(2)}
            </span>
          </div>

          <p className="text-[#f5f1ec]/70 leading-relaxed">{dish.description}</p>

          {/* Stats — like the nutrition rows in reference */}
          <div className="rounded-2xl bg-[var(--color-surface-2)] divide-y divide-[var(--color-surface-3)]">
            <StatRow label="Portion" value={dish.portionSize ?? '1 serving'} />
            <StatRow
              label="Allergens"
              value={dish.allergens.length > 0 ? dish.allergens.join(', ') : 'None disclosed'}
            />
            <StatRow label="Lead time" value={`${dish.leadTimeHours} h notice`} />
            {dish.dishCategory === 'TCS' && (
              <StatRow label="Category" value="TCS · DSHS registered" valueClass="text-brand-400" />
            )}
          </div>

          {/* Allergen pills if any — like ingredient pills in reference */}
          {dish.allergens.length > 0 && (
            <div>
              <p className="text-xs text-[#f5f1ec]/40 uppercase tracking-wider mb-2">
                Contains
              </p>
              <div className="flex flex-wrap gap-2">
                {dish.allergens.map((a) => (
                  <Chip key={a} variant="warning">
                    {a}
                  </Chip>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[var(--color-surface-0)] via-[var(--color-surface-0)]/95 to-transparent pt-8 pb-6 px-6 z-10">
        <div className="max-w-3xl mx-auto">
          <AddToCartButton
            cookId={dish.cookId}
            cookName={dish.cookName}
            dishId={dish.id}
            name={dish.name}
            priceCents={dish.priceCents}
            photoUrl={dish.photoUrl ?? img}
          />
        </div>
      </div>
    </main>
  );
}

function StatRow({
  label,
  value,
  valueClass = '',
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex justify-between items-center px-5 py-3">
      <span className="text-sm text-[#f5f1ec]/50">{label}</span>
      <span className={`text-sm font-semibold ${valueClass || 'text-[#f5f1ec]'}`}>
        {value}
      </span>
    </div>
  );
}
