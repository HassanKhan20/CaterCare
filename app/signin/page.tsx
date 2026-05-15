import { signIn } from '@/lib/auth';
import { Btn } from '@/components/ui/Btn';
import { DevSignIn } from '@/components/DevSignIn';
import Link from 'next/link';

export default function SignInPage() {
  const isDev = process.env.NODE_ENV === 'development';
  return (
    <main className="cc-page cc-page-narrow" style={{ maxWidth: 460 }}>
      <Link href="/" className="cc-back" style={{ paddingTop: 0 }}>
        ← Home
      </Link>

      <div style={{ marginTop: 40 }}>
        <Link href="/" className="cc-logo cc-logo-static" style={{ marginBottom: 32 }}>
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

        <h1
          className="cc-page-title"
          style={{ fontSize: 'clamp(36px, 4vw, 52px)', marginTop: 24 }}
        >
          Welcome back.
        </h1>
        <p className="cc-page-sub">Sign in to order, cook, or drive.</p>

        <div
          style={{
            padding: 32,
            border: '1px solid var(--line)',
            background: 'var(--surface)',
            borderRadius: 4,
            marginTop: 32,
          }}
        >
          <form
            action={async () => {
              'use server';
              await signIn('google');
            }}
          >
            <Btn type="submit" variant="primary" size="lg" full>
              Continue with Google
            </Btn>
          </form>

          {isDev && <DevSignIn />}
        </div>

        <p
          className="cc-mono"
          style={{
            fontSize: 11,
            color: 'var(--muted)',
            marginTop: 24,
            textAlign: 'center',
          }}
        >
          By signing in you agree to our terms. We&apos;ll never sell your info.
        </p>
      </div>
    </main>
  );
}
