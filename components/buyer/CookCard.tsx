import Link from 'next/link';
import { Chip } from '@/components/ui/Chip';
import { Rating } from '@/components/ui/Rating';
import { TimeChip } from '@/components/ui/TimeChip';

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

// Deterministic placeholder food photo when cook has no photoUrl —
// uses a stable Unsplash food collection so each cook gets a different image.
function placeholderFor(id: string): string {
  const photos = [
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80', // pizza
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80', // salad
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80', // biryani
    'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&q=80', // tacos
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80', // pancakes
    'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=600&q=80', // burger
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return photos[Math.abs(hash) % photos.length];
}

export function CookCard({ cook }: { cook: Cook }) {
  const img = cook.photoUrl ?? placeholderFor(cook.id);
  return (
    <Link
      href={`/cooks/${cook.id}`}
      className="group block rounded-3xl overflow-hidden bg-[var(--color-surface-1)] border border-[var(--color-surface-3)] hover:border-brand-400/40 transition-all"
    >
      <div className="relative h-44 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img}
          alt={cook.name ?? 'cook'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 right-3">
          <TimeChip label={`${cook.distanceMiles.toFixed(1)} mi`} />
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-bold text-[#f5f1ec] mb-1.5 group-hover:text-brand-400 transition-colors">
          {cook.name}
        </h3>
        <div className="flex items-center gap-2 mb-2">
          {/* Until we have real ratings, show 5 stars deterministically.
              v1.1: render real ratings from a Review model. */}
          <Rating value={5} />
          <span className="text-xs text-[#f5f1ec]/40">
            · {cook.dishCount} dish{cook.dishCount === 1 ? '' : 'es'}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {cook.cuisineTags.slice(0, 3).map((t) => (
            <Chip key={t} variant="brand">
              {t}
            </Chip>
          ))}
        </div>
        {cook.story && (
          <p className="text-sm text-[#f5f1ec]/60 line-clamp-2 leading-relaxed">
            {cook.story}
          </p>
        )}
      </div>
    </Link>
  );
}
