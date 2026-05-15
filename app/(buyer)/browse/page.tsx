import Link from 'next/link';
import { CookCard } from '@/components/buyer/CookCard';
import { Btn } from '@/components/ui/Btn';
import { Icon } from '@/components/ui/Icon';
import { Stars } from '@/components/ui/Stars';
import { PriceTag } from '@/components/ui/PriceTag';
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

const CUISINES = [
  { id: 'all', label: 'All cuisines' },
  { id: 'Pakistani', label: 'Pakistani' },
  { id: 'Mexican', label: 'Mexican' },
  { id: 'Ethiopian', label: 'Ethiopian' },
  { id: 'Indian', label: 'Indian' },
  { id: 'Vietnamese', label: 'Vietnamese' },
];

function todayLabel() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ lat?: string; lng?: string; cuisine?: string }>;
}) {
  const params = await searchParams;
  const lat = parseFloat(params.lat ?? '33.0738');
  const lng = parseFloat(params.lng ?? '-96.7480');
  const cuisine = params.cuisine && params.cuisine !== 'all' ? params.cuisine : undefined;

  const cooks = await fetchCooks(lat, lng, cuisine);
  const featured = cooks[0];
  const rest = cooks.slice(1);

  const buildHref = (id: string) =>
    id === 'all'
      ? `/browse?lat=${lat}&lng=${lng}`
      : `/browse?lat=${lat}&lng=${lng}&cuisine=${encodeURIComponent(id)}`;

  const activeId = cuisine ?? 'all';

  return (
    <main className="cc-page">
      {/* Editorial hero */}
      <section className="cc-hero">
        <div className="cc-hero-meta">
          <span className="cc-tag">Plano · Frisco · Allen · Dallas</span>
          <span className="cc-tag-dot">{todayLabel()}</span>
        </div>
        <h1 className="cc-hero-title">Dinner from the kitchen down the street.</h1>
        <div className="cc-hero-foot">
          <p className="cc-hero-desc">
            {cooks.length} home cooks within ten miles of you. Licensed kitchens,
            fair pay, food made by someone you could actually meet.
          </p>
          <div className="cc-hero-stats">
            <Stat label="Cooks near you" value={String(cooks.length)} />
            <Stat label="Avg fee vs. apps" value="−18%" tone="accent" />
            <Stat label="Cook payout" value="88¢/$1" />
          </div>
        </div>
      </section>

      {/* Cuisine filter strip */}
      <section className="cc-strip">
        <div className="cc-strip-inner">
          <div className="cc-chips">
            {CUISINES.map((c) => (
              <Link
                key={c.id}
                href={buildHref(c.id)}
                className={`cc-chip cc-chip-neutral ${activeId === c.id ? 'is-active' : ''}`}
              >
                {c.label}
              </Link>
            ))}
          </div>
          <div className="cc-sort">
            <Icon name="sort" size={14} />
            <span>Nearest first</span>
          </div>
        </div>
      </section>

      {/* Featured cook — editorial split */}
      {featured && (
        <Link href={`/cooks/${featured.id}`} className="cc-featured">
          <div className="cc-featured-img">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoFor(featured.id, featured.photoUrl)}
              alt={featured.name ?? 'cook'}
            />
            <div className="cc-featured-overlay">
              <span className="cc-tag cc-tag-light">This week&apos;s pick</span>
            </div>
          </div>
          <div className="cc-featured-body">
            <div className="cc-featured-eyebrow">
              <span>{featured.cuisineTags.join(' · ') || 'Home kitchen'}</span>
              <span>·</span>
              <span>{featured.distanceMiles.toFixed(1)} mi</span>
            </div>
            <h2 className="cc-featured-name">{featured.name}</h2>
            {featured.story && (
              <p className="cc-featured-story">&ldquo;{featured.story}&rdquo;</p>
            )}
            <div className="cc-featured-meta">
              <div className="cc-meta-block">
                <span className="cc-meta-num">5.0</span>
                <span className="cc-meta-cap">just opened</span>
              </div>
              <div className="cc-meta-block">
                <span className="cc-meta-num">{featured.dishCount}</span>
                <span className="cc-meta-cap">on the menu</span>
              </div>
              <div className="cc-meta-block">
                <span className="cc-meta-num">
                  10<span className="cc-meta-suf">mi</span>
                </span>
                <span className="cc-meta-cap">delivery radius</span>
              </div>
            </div>
            <Btn variant="primary" size="lg" iconAfter="arrow-right">
              See the menu
            </Btn>
          </div>
        </Link>
      )}

      {/* All cooks */}
      {rest.length > 0 && (
        <section className="cc-section">
          <header className="cc-section-head">
            <div>
              <h3 className="cc-section-title">All cooks near you</h3>
              <p className="cc-section-sub">
                {cooks.length} approved within 10 miles
              </p>
            </div>
          </header>
          <div className="cc-grid">
            {rest.map((c, i) => (
              <CookCard key={c.id} cook={c} variant={i === 0 ? 'wide' : 'default'} />
            ))}
          </div>
        </section>
      )}

      {cooks.length === 0 && (
        <section className="cc-section">
          <p className="cc-page-sub">
            No cooks in your area yet. We&apos;re growing fast — check back soon.
          </p>
        </section>
      )}

      {/* Footer */}
      <footer className="cc-footer">
        <div className="cc-footer-inner">
          <div>
            <div className="cc-logo cc-logo-static">
              <span className="cc-logo-mark">
                <svg viewBox="0 0 32 32" width="22" height="22">
                  <circle
                    cx="16"
                    cy="16"
                    r="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                  />
                  <path
                    d="M9 16c2-3 5-3 7 0s5 3 7 0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <span className="cc-logo-text">catercare</span>
            </div>
            <p className="cc-footer-tag">
              Hyperlocal home food, DFW.
              <br />
              Built under Texas SB 541.
            </p>
          </div>
          <FooterCol
            title="Eat"
            links={['Browse cooks', 'Cuisines', 'Gift cards', 'Subscriptions']}
          />
          <FooterCol
            title="Cook with us"
            links={['Apply to cook', 'Cook handbook', 'DSHS guide', 'Fee structure']}
          />
          <FooterCol
            title="Deliver"
            links={['Become a driver', 'Driver app', 'Background check']}
          />
          <FooterCol
            title="Catercare"
            links={['About', 'Press', 'Contact', 'Terms', 'Privacy']}
          />
        </div>
        <div className="cc-footer-bottom">
          <span>© 2026 Catercare, Inc.</span>
          <span className="cc-mono">
            10–12% cook commission · 8–10% buyer fee · 100% of tips to drivers
          </span>
        </div>
      </footer>
    </main>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'accent';
}) {
  return (
    <div className="cc-stat" data-tone={tone}>
      <div className="cc-stat-val">{value}</div>
      <div className="cc-stat-lab">{label}</div>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div className="cc-footer-col">
      <h4>{title}</h4>
      <ul>
        {links.map((l) => (
          <li key={l}>
            <a href="#">{l}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Suppress unused-import lint for things we'll use in later page ports.
void Stars;
void PriceTag;
