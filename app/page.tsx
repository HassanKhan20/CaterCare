import Link from 'next/link';
import { Btn } from '@/components/ui/Btn';

export default function Home() {
  return (
    <main className="cc-page">
      {/* Top bar */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px 0',
        }}
      >
        <Link href="/" className="cc-logo cc-logo-static">
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
        </Link>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/signin">
            <Btn variant="ghost" size="sm">
              Sign in
            </Btn>
          </Link>
          <Link href="/signup">
            <Btn variant="primary" size="sm">
              Sign up
            </Btn>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="cc-hero" style={{ paddingTop: 32 }}>
        <div className="cc-hero-meta">
          <span className="cc-tag">Now in DFW</span>
          <span className="cc-tag-dot">
            Plano · Frisco · Allen · Dallas
          </span>
        </div>
        <h1 className="cc-hero-title">
          Dinner from the kitchen down the street.
        </h1>
        <div className="cc-hero-foot">
          <p className="cc-hero-desc">
            Home cooks in your neighborhood. Delivered by drivers who keep 100% of
            their tips. Built for the people doing the work — under Texas SB&nbsp;541.
          </p>
          <div className="cc-hero-stats">
            <Stat label="Cook payout" value="88¢/$1" tone="accent" />
            <Stat label="Avg fee vs. apps" value="−18%" />
            <Stat label="Tips to drivers" value="100%" />
          </div>
        </div>
      </section>

      {/* Three-up */}
      <section className="cc-section">
        <header className="cc-section-head">
          <div>
            <h3 className="cc-section-title">Built three ways.</h3>
            <p className="cc-section-sub">Cooks, neighbors, drivers — fair on every side.</p>
          </div>
        </header>
        <div className="cc-about-grid" style={{ padding: 0 }}>
          <div>
            <h3>For cooks</h3>
            <p>
              Sell from your kitchen. Set your own hours. 10% platform fee — much
              less than the apps take.
            </p>
            <Link href="/cook/onboarding" className="cc-link-sm">
              Apply to cook →
            </Link>
          </div>
          <div>
            <h3>For neighbors</h3>
            <p>
              Discover Pakistani, Mexican, Ethiopian and more — made by people who
              live near you.
            </p>
            <Link href="/browse" className="cc-link-sm">
              Browse cooks →
            </Link>
          </div>
          <div>
            <h3>For drivers</h3>
            <p>
              Claim deliveries on your schedule. See exact tips before you accept.
              Keep 100% of them.
            </p>
            <Link href="/driver/onboarding" className="cc-link-sm">
              Drive for us →
            </Link>
          </div>
        </div>
      </section>

      {/* Fairness band */}
      <section className="cc-section">
        <div
          style={{
            border: '1px solid var(--line)',
            background: 'var(--surface)',
            borderRadius: 4,
            padding: 'clamp(40px, 6vw, 72px)',
            textAlign: 'center',
          }}
        >
          <h2
            className="cc-section-title"
            style={{ fontSize: 'clamp(32px, 4vw, 52px)', marginBottom: 16 }}
          >
            We&apos;re not DoorDash.
          </h2>
          <p
            className="cc-hero-desc"
            style={{ maxWidth: '52ch', margin: '0 auto' }}
          >
            Cooks keep 88¢ of every dollar. Drivers see the exact tip before they
            accept. No pooled tips, no surprise fees, no surprise commissions.
          </p>
          <div style={{ marginTop: 28 }}>
            <Link href="/browse">
              <Btn variant="primary" size="lg" iconAfter="arrow-right">
                Start ordering
              </Btn>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="cc-footer">
        <div className="cc-footer-inner">
          <div>
            <div className="cc-logo cc-logo-static">
              <span className="cc-logo-mark">
                <svg viewBox="0 0 32 32" width="22" height="22">
                  <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="2.4" />
                  <path d="M9 16c2-3 5-3 7 0s5 3 7 0" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
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
          <FooterCol title="Eat" links={['Browse cooks', 'Cuisines']} />
          <FooterCol title="Cook with us" links={['Apply to cook', 'DSHS guide']} />
          <FooterCol title="Deliver" links={['Become a driver']} />
          <FooterCol title="Catercare" links={['About', 'Terms', 'Privacy']} />
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
