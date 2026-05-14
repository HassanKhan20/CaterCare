import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-brand-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(249,115,22,0.15),transparent_50%)]" />
        <div className="relative max-w-6xl mx-auto px-4 py-24 md:py-32">
          <div className="max-w-3xl">
            <span className="inline-block px-3 py-1 bg-brand-100 text-brand-800 rounded-full text-xs font-semibold uppercase tracking-wide mb-6">
              Now in DFW
            </span>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
              Real food.
              <br />
              <span className="text-brand-600">Real neighbors.</span>
            </h1>
            <p className="mt-6 text-xl text-slate-600 max-w-2xl">
              CaterCare connects local home cooks with hungry neighbors. Authentic,
              homemade food delivered by drivers who keep 100% of tips. Cooks keep what
              they earn.
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
              <Link href="/driver/onboarding">
                <Button variant="ghost" size="lg">
                  Drive for us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Three-up explainer */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <Feature
            emoji="👩‍🍳"
            title="For cooks"
            body="Sell food from your kitchen. Set your own hours. 10% platform fee — much less than DoorDash takes."
          />
          <Feature
            emoji="🍽️"
            title="For neighbors"
            body="Discover real home-cooked Pakistani, Mexican, Ethiopian, and more — made by people who live in your neighborhood."
          />
          <Feature
            emoji="🚗"
            title="For drivers"
            body="Claim deliveries when you want. Transparent pay. 100% of tips go to you, period."
          />
        </div>
      </section>

      {/* Fairness band */}
      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            We're not DoorDash.
          </h2>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Cooks keep 88%+ of every order. Drivers see the exact tip before they
            accept. No tip pooling, no surprise fees, no surprise commissions. Built
            for the people doing the work.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-4 py-10 text-sm text-slate-500 flex justify-between">
        <span>© CaterCare · DFW · Texas SB 541 compliant</span>
        <Link href="/signin" className="hover:text-brand-600">
          Sign in
        </Link>
      </footer>
    </main>
  );
}

function Feature({ emoji, title, body }: { emoji: string; title: string; body: string }) {
  return (
    <div className="text-center">
      <div className="text-5xl mb-4">{emoji}</div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600">{body}</p>
    </div>
  );
}
