'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Stars } from '@/components/ui/Stars';
import { photoFor } from '@/lib/food-photo';

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

type Props = {
  cook: Cook;
  variant?: 'default' | 'wide';
};

// Until we ship reviews, every cook displays 5 stars. Wire up to a real Review
// model in v1.1.
const PLACEHOLDER_RATING = 5;
const PLACEHOLDER_REVIEW_COUNT = 0;

export function CookCard({ cook, variant = 'default' }: Props) {
  const [liked, setLiked] = useState(false);
  const img = photoFor(cook.id, cook.photoUrl);
  const cuisineLine = cook.cuisineTags.join(' · ') || 'Home kitchen';

  const onLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLiked((v) => !v);
  };

  if (variant === 'wide') {
    return (
      <Link href={`/cooks/${cook.id}`} className="cc-card cc-card-wide">
        <div className="cc-card-img">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} alt={cook.name ?? 'cook'} />
          <button type="button" className="cc-fav" onClick={onLike} aria-label="Save">
            <Icon name={liked ? 'heart-fill' : 'heart'} size={16} />
          </button>
        </div>
        <div className="cc-card-body">
          <div className="cc-card-eye">
            <span>{cuisineLine}</span>
            <span> · </span>
            <span>
              {cook.distanceMiles.toFixed(1)} mi
              {cook.neighborhood ? ` · ${cook.neighborhood}` : ''}
            </span>
          </div>
          <h4 className="cc-card-name">{cook.name}</h4>
          {cook.story && (
            <p className="cc-card-story">&ldquo;{cook.story.split('.')[0]}.&rdquo;</p>
          )}
          <div className="cc-card-foot">
            <div className="cc-card-rate">
              <Stars value={PLACEHOLDER_RATING} size={13} />
              <span className="cc-mono">
                {PLACEHOLDER_RATING.toFixed(1)} · {PLACEHOLDER_REVIEW_COUNT}
              </span>
            </div>
            <span className="cc-card-dishes">{cook.dishCount} dishes →</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/cooks/${cook.id}`} className="cc-card">
      <div className="cc-card-img">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img} alt={cook.name ?? 'cook'} />
        <button type="button" className="cc-fav" onClick={onLike} aria-label="Save">
          <Icon name={liked ? 'heart-fill' : 'heart'} size={16} />
        </button>
        <div className="cc-card-distance">
          <Icon name="pin" size={11} /> {cook.distanceMiles.toFixed(1)} mi
        </div>
      </div>
      <div className="cc-card-body">
        <div className="cc-card-eye">{cuisineLine}</div>
        <h4 className="cc-card-name">{cook.name}</h4>
        <div className="cc-card-foot">
          <div className="cc-card-rate">
            <Stars value={PLACEHOLDER_RATING} size={12} />
            <span className="cc-mono">{PLACEHOLDER_RATING.toFixed(1)}</span>
          </div>
          <span className="cc-card-dishes">{cook.dishCount} dishes</span>
        </div>
      </div>
    </Link>
  );
}
