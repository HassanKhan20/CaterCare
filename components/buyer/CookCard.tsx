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

export function CookCard({ cook }: { cook: Cook }) {
  return (
    <Link
      href={`/cooks/${cook.id}`}
      className="group block rounded-xl border border-slate-200 bg-white overflow-hidden hover:shadow-md hover:border-brand-300 transition-all"
    >
      <div className="h-32 bg-gradient-to-br from-brand-100 to-brand-200 relative flex items-center justify-center">
        {cook.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cook.photoUrl}
            alt={cook.name ?? 'cook'}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <span className="text-5xl font-bold text-brand-700/40">
            {(cook.name ?? '?').slice(0, 1)}
          </span>
        )}
        <span className="absolute top-2 right-2 px-2 py-1 bg-white/90 backdrop-blur rounded-full text-xs font-medium text-slate-700">
          {cook.distanceMiles.toFixed(1)} mi
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-slate-900 group-hover:text-brand-700 transition-colors">
          {cook.name}
        </h3>
        <div className="flex flex-wrap gap-1 mt-1">
          {cook.cuisineTags.map((t) => (
            <span
              key={t}
              className="text-xs px-2 py-0.5 bg-brand-50 text-brand-800 rounded-full"
            >
              {t}
            </span>
          ))}
        </div>
        {cook.story && (
          <p className="text-sm text-slate-600 line-clamp-2 mt-2">{cook.story}</p>
        )}
        <p className="text-xs text-slate-500 mt-2">
          {cook.dishCount} dish{cook.dishCount === 1 ? '' : 'es'} · {cook.neighborhood}
        </p>
      </div>
    </Link>
  );
}
