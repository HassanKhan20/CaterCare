import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { Stars } from '@/components/ui/Stars';
import { PriceTag } from '@/components/ui/PriceTag';
import { photoFor } from '@/lib/food-photo';

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

// Placeholder until we wire a Review model.
const PLACEHOLDER_RATING = 5.0;
const PLACEHOLDER_REVIEWS = 0;
const PLACEHOLDER_YEARS = 1;
const PLACEHOLDER_BADGES = ['TX SB 541 cottage food operator', 'Background-checked'];

export default async function CookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cook = await fetchCook(id);
  if (!cook) notFound();

  const cover = photoFor(cook.id, cook.photoUrl);

  return (
    <main className="cc-page">
      <Link href="/browse" className="cc-back">
        <Icon name="arrow-left" size={14} /> All cooks
      </Link>

      {/* Cook header — editorial split */}
      <section className="cc-cook-head">
        <div className="cc-cook-head-text">
          <div className="cc-eye">
            {cook.cuisineTags.join(' · ') || 'Home kitchen'}
            {cook.neighborhood ? ` · ${cook.neighborhood}` : ''}
          </div>
          <h1 className="cc-cook-name">{cook.name}</h1>
          <div className="cc-cook-meta">
            <span>
              <Stars value={PLACEHOLDER_RATING} size={14} />{' '}
              <strong>{PLACEHOLDER_RATING.toFixed(1)}</strong>{' '}
              <span className="cc-muted">({PLACEHOLDER_REVIEWS} reviews)</span>
            </span>
            <span className="cc-dot">·</span>
            <span>
              <Icon name="clock" size={13} /> {PLACEHOLDER_YEARS} year cooking
            </span>
          </div>
          {cook.story && <p className="cc-cook-story">&ldquo;{cook.story}&rdquo;</p>}
          <div className="cc-cook-badges">
            {PLACEHOLDER_BADGES.map((b) => (
              <span key={b} className="cc-badge">
                <Icon name="shield" size={13} /> {b}
              </span>
            ))}
          </div>
        </div>
        <div className="cc-cook-head-img">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cover} alt={cook.name ?? 'cook'} />
          <div className="cc-cook-portrait">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cover} alt={cook.name ?? 'cook'} />
          </div>
        </div>
      </section>

      {/* Menu — the prototype has Menu/About/Schedule tabs; we ship Menu only in v1
          since About/Schedule pull data we don't have yet. */}
      <div className="cc-tabs">
        <span className="is-on" style={{ padding: '18px 0', display: 'inline-block' }}>
          Menu <span className="cc-mono">({cook.dishes.length})</span>
        </span>
      </div>

      {cook.dishes.length === 0 ? (
        <p className="cc-muted">No dishes available right now.</p>
      ) : (
        <section className="cc-menu">
          {cook.dishes.map((d) => (
            <DishRow key={d.id} dish={d} />
          ))}
        </section>
      )}
    </main>
  );
}

function DishRow({ dish }: { dish: Dish }) {
  const img = photoFor(dish.id, dish.photoUrl);
  return (
    <Link href={`/dishes/${dish.id}`} className="cc-dish-row">
      <div className="cc-dish-row-body">
        <div className="cc-dish-row-head">
          <h4>{dish.name}</h4>
          <PriceTag cents={dish.priceCents} />
        </div>
        <p>{dish.description}</p>
        <div className="cc-dish-row-meta">
          <span className="cc-mono">
            <Icon name="clock" size={12} /> {dish.leadTimeHours}h lead
          </span>
          <span className="cc-mono cc-tag-mini">
            {dish.dishCategory === 'TCS' ? 'DSHS · TCS' : 'Shelf-stable'}
          </span>
          {dish.allergens.length > 0 && (
            <span className="cc-allergens">contains {dish.allergens.join(', ')}</span>
          )}
        </div>
      </div>
      <div className="cc-dish-row-img">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img} alt={dish.name} />
      </div>
    </Link>
  );
}
