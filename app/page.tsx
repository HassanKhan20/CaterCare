import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--color-surface-0)]">
      {/* Soft decorative wash */}
      <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-gradient-to-bl from-brand-400/8 via-transparent to-transparent pointer-events-none" />

      {/* Nav */}
      <nav className="relative max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold tracking-tight">
          CaterCare
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/signin">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link href="/browse">
            <Button size="sm">Order food</Button>
          </Link>
        </div>
      </nav>

      {/* Hero — split: bold copy left, photo right */}
      <section className="relative max-w-7xl mx-auto px-6 py-12 md:py-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-400/10 text-brand-300 rounded-full text-xs font-semibold uppercase tracking-wider mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
            Now in DFW
          </span>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[0.95]">
            Real food
            <br />
            from <span className="text-brand-400">real</span>
            <br />
            <span className="text-brand-400">neighbors</span>.
          </h1>
          <p className="mt-6 text-lg text-[#f5f1ec]/60 max-w-md leading-relaxed">
            Home cooks in your neighborhood. Delivered by drivers who keep 100% of
            their tips. Built for the people doing the work.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/browse">
              <Button size="lg">Browse cooks near me</Button>
            </Link>
            <Link href="/cook/onboarding">
              <Button variant="secondary" size="lg">
                Become a cook
              </Button>
            </Link>
          </div>
        </div>

        {/* Hero photo collage */}
        <div className="relative h-[500px] hidden md:block">
          <div className="absolute top-0 right-0 w-[280px] h-[360px] rounded-3xl overflow-hidden shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80"
              alt="Fresh salad bowl"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute bottom-0 left-0 w-[260px] h-[320px] rounded-3xl overflow-hidden shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80"
              alt="Pizza"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute top-[140px] left-[180px] w-[160px] h-[160px] rounded-full overflow-hidden shadow-2xl ring-4 ring-[var(--color-surface-0)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&q=80"
              alt="Biryani"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Three-up explainer */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-4">
          <Feature
            emoji="👩‍🍳"
            title="For cooks"
            body="Sell from your kitchen. Set your own hours. We take just 10% — way less than DoorDash."
          />
          <Feature
            emoji="🍽️"
            title="For neighbors"
            body="Discover Pakistani, Mexican, Ethiopian and more — made by people who live near you."
          />
          <Feature
            emoji="🚗"
            title="For drivers"
            body="Claim deliveries on your schedule. See exact tips before you accept. Keep 100%."
          />
        </div>
      </section>

      {/* Fairness band */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="rounded-3xl bg-gradient-to-br from-brand-400/15 to-transparent border border-brand-400/20 p-12 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            We&apos;re not DoorDash.
          </h2>
          <p className="text-lg text-[#f5f1ec]/70 max-w-2xl mx-auto">
            Cooks keep 88%+ of every order. Drivers see the exact tip before they
            accept. No pooled tips, no surprise fees, no surprise commissions.
          </p>
        </div>
      </section>

      <footer className="max-w-7xl mx-auto px-6 py-10 text-sm text-[#f5f1ec]/40 flex justify-between border-t border-[var(--color-surface-3)]">
        <span>© CaterCare · DFW · Texas SB 541 compliant</span>
        <Link href="/signin" className="hover:text-brand-400 transition-colors">
          Sign in
        </Link>
      </footer>
    </main>
  );
}

function Feature({ emoji, title, body }: { emoji: string; title: string; body: string }) {
  return (
    <div className="rounded-3xl bg-[var(--color-surface-1)] border border-[var(--color-surface-3)] p-8 hover:border-brand-400/30 transition-colors">
      <div className="text-4xl mb-4">{emoji}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-[#f5f1ec]/60 leading-relaxed">{body}</p>
    </div>
  );
}
