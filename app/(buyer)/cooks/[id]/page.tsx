import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Chip } from '@/components/ui/Chip';
import { BuyerNavBar } from '@/components/BuyerNavBar';

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
    new URL(`/api/public/cooks/${id}`, process.env.APP_URL ?? 'http://localhost:3001'),
    { cache: 'no-store' },
  );
  if (!res.ok) return null;
  return (await res.json()).cook;
}

function placeholderFor(id: string): string {
  const photos = [
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
    'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&q=80',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80',
    'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=800&q=80',
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return photos[Math.abs(hash) % photos.length];
}

export default async function CookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cook = await fetchCook(id);
  if (!cook) notFound();

  const heroImg = cook.photoUrl ?? placeholderFor(cook.id);

  return (
    <main className="min-h-screen bg-[var(--color-surface-0)]">
      <BuyerNavBar />

      {/* Hero strip */}
      <div className="relative h-56 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={heroImg} alt="" className="w-full h-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--color-surface-0)]" />
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-20 relative pb-12">
        {/* Cook identity card */}
        <div className="rounded-3xl bg-[var(--color-surface-1)] border border-[var(--color-surface-3)] p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-5 items-start">
            <div className="relative shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroImg}
                alt={cook.name ?? 'cook'}
                className="w-24 h-24 rounded-full object-cover ring-4 ring-[var(--color-surface-1)]"
              />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold tracking-tight">{cook.name}</h1>
              <div className="flex flex-wrap gap-1.5 mt-2 mb-3">
                {cook.cuisineTags.map((t) => (
                  <Chip key={t} variant="brand">
                    {t}
                  </Chip>
                ))}
                {cook.neighborhood && <Chip>📍 {cook.neighborhood}</Chip>}
              </div>
              {cook.story && (
                <p className="text-[#f5f1ec]/70 leading-relaxed max-w-prose">{cook.story}</p>
              )}
            </div>
          </div>
        </div>

        {/* Menu */}
        <div>
          <h2 className="text-2xl font-bold mb-1">Menu</h2>
          <p className="text-sm text-[#f5f1ec]/50 mb-5">
            {cook.dishes.length} dish{cook.dishes.length === 1 ? '' : 'es'} available
          </p>
          {cook.dishes.length === 0 ? (
            <p className="text-[#f5f1ec]/50 text-sm">No dishes yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cook.dishes.map((d) => (
                <DishMenuCard key={d.id} dish={d} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function DishMenuCard({ dish }: { dish: Dish }) {
  const img = dish.photoUrl ?? placeholderFor(dish.id);
  return (
    <Link
      href={`/dishes/${dish.id}`}
      className="group block rounded-2xl bg-[var(--color-surface-1)] border border-[var(--color-surface-3)] hover:border-brand-400/40 transition-all overflow-hidden"
    >
      <div className="flex gap-4 p-4">
        <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img}
            alt={dish.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2 mb-1">
            <h3 className="font-bold text-[#f5f1ec] leading-tight group-hover:text-brand-400 transition-colors">
              {dish.name}
            </h3>
            <span className="font-bold text-brand-400 shrink-0">
              ${(dish.priceCents / 100).toFixed(2)}
            </span>
          </div>
          <p className="text-sm text-[#f5f1ec]/60 line-clamp-2">{dish.description}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {dish.dishCategory === 'TCS' && (
              <span className="text-[10px] px-2 py-0.5 bg-brand-400/15 text-brand-300 rounded-full font-medium">
                TCS
              </span>
            )}
            <span className="text-[10px] px-2 py-0.5 bg-[var(--color-surface-2)] text-[#f5f1ec]/50 rounded-full">
              {dish.leadTimeHours}h notice
            </span>
            {dish.allergens.length > 0 && (
              <span className="text-[10px] px-2 py-0.5 bg-amber-500/15 text-amber-300 rounded-full">
                ⚠️ {dish.allergens.length} allergen{dish.allergens.length === 1 ? '' : 's'}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
