import Link from 'next/link';
import { Card } from '@/components/ui/Card';

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

export function CookCard({ cook }: { cook: Cook }) {
  return (
    <Link href={`/cooks/${cook.id}`}>
      <Card className="hover:shadow-md transition cursor-pointer h-full">
        <div className="flex items-start gap-3">
          {cook.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cook.photoUrl}
              alt={cook.name ?? 'cook'}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold">
              {(cook.name ?? '?').slice(0, 1)}
            </div>
          )}
          <div className="flex-1">
            <h3 className="font-bold">{cook.name}</h3>
            <p className="text-sm text-slate-600">{cook.cuisineTags.join(' · ')}</p>
            <p className="text-xs text-slate-500">
              {cook.distanceMiles.toFixed(1)} mi · {cook.dishCount} dish
              {cook.dishCount === 1 ? '' : 'es'}
            </p>
          </div>
        </div>
        {cook.story && (
          <p className="text-sm mt-3 line-clamp-2 text-slate-700">{cook.story}</p>
        )}
      </Card>
    </Link>
  );
}
