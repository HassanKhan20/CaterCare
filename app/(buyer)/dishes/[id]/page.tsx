import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { PriceTag } from '@/components/ui/PriceTag';
import { AddToCartButton } from '@/components/buyer/AddToCartButton';
import { photoFor } from '@/lib/food-photo';

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

export default async function DishPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dish = await fetchDish(id);
  if (!dish) notFound();

  const img = photoFor(dish.id, dish.photoUrl);
  const category =
    dish.dishCategory === 'TCS'
      ? 'Prepared meal (TCS) · DSHS registered'
      : 'Shelf-stable (non-TCS)';

  return (
    <main className="cc-page">
      <Link href={`/cooks/${dish.cookId}`} className="cc-back">
        <Icon name="arrow-left" size={14} /> {dish.cookName}
      </Link>

      {/* Two-column dish detail — same shape as the prototype's DishSheet but
          rendered as a routed page instead of a modal. */}
      <section className="cc-sheet cc-sheet-dish" style={{ maxWidth: '100%', boxShadow: 'none', background: 'transparent' }}>
        <div className="cc-dish-photo" style={{ borderRadius: 4 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} alt={dish.name} />
        </div>
        <div className="cc-dish-body">
          <Link href={`/cooks/${dish.cookId}`} className="cc-dish-cookline">
            <span className="cc-dish-cook-avatar">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoFor(dish.cookId)} alt="" />
            </span>
            <span>
              By <strong>{dish.cookName}</strong>
            </span>
            <Icon name="arrow-right" size={13} />
          </Link>
          <h2>{dish.name}</h2>
          <p className="cc-dish-desc">{dish.description}</p>

          <dl className="cc-detail-list">
            <DetailRow label="Lead time" value={`${dish.leadTimeHours} hours notice`} />
            <DetailRow label="Category" value={category} />
            <DetailRow
              label="Allergens"
              value={dish.allergens.length ? dish.allergens.join(', ') : 'None disclosed'}
            />
            <DetailRow label="Portion" value={dish.portionSize ?? '1 serving'} />
          </dl>

          <AddToCartButton
            cookId={dish.cookId}
            cookName={dish.cookName}
            dishId={dish.id}
            name={dish.name}
            priceCents={dish.priceCents}
            photoUrl={img}
          />
        </div>
      </section>
    </main>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="cc-detail-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

void PriceTag;
