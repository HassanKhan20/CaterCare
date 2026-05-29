'use client';
import { useState, type CSSProperties } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Btn } from '@/components/ui/Btn';

type Mode = 'signin' | 'signup';
type Role = 'BUYER' | 'COOK' | 'DRIVER';

const ROLES: { value: Role; label: string; blurb: string }[] = [
  { value: 'BUYER', label: 'Order food', blurb: 'Buy home-cooked meals from neighbors' },
  { value: 'COOK', label: 'Cook & sell', blurb: 'Sell food you make from your home kitchen' },
  { value: 'DRIVER', label: 'Deliver', blurb: 'Earn money delivering orders nearby' },
];

// Where each role lands after a successful sign-up.
const DEST: Record<Role, string> = {
  BUYER: '/browse',
  COOK: '/cook/onboarding',
  DRIVER: '/driver',
};

const fieldStyle: CSSProperties = {
  width: '100%',
  padding: '11px 12px',
  border: '1px solid var(--line)',
  background: 'var(--bg)',
  color: 'var(--ink)',
  borderRadius: 4,
  fontSize: 15,
  fontFamily: 'inherit',
};

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: 10.5,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
  margin: '0 0 6px',
};

export function CredentialsForm({ mode }: { mode: Mode }) {
  const isSignup = mode === 'signup';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('BUYER');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = () => {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('from');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isSignup && name.trim().length === 0) {
      setError('Please enter your name.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }
    if (isSignup && password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setSubmitting(true);
    try {
      if (isSignup) {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ name, email, password, role }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          setError(
            j.error === 'EMAIL_TAKEN'
              ? 'An account with that email already exists. Try signing in.'
              : j.error === 'INVALID_INPUT'
                ? 'Please check your details and try again.'
                : 'Could not create your account. Please try again.',
          );
          return;
        }
      }

      const result = await signIn('password', { email, password, redirect: false });
      if (!result?.ok) {
        setError(
          isSignup
            ? 'Account created, but sign-in failed. Please try signing in.'
            : 'Wrong email or password.',
        );
        return;
      }
      window.location.assign(isSignup ? DEST[role] : (from() ?? '/'));
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {isSignup && (
        <div>
          <span style={labelStyle}>I want to</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ROLES.map((r) => {
              const selected = role === r.value;
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  style={{
                    textAlign: 'left',
                    padding: '12px 14px',
                    border: `1px solid ${selected ? 'var(--accent)' : 'var(--line)'}`,
                    background: selected ? 'var(--accent-soft, rgba(92,117,70,0.08))' : 'var(--bg)',
                    borderRadius: 4,
                    cursor: 'pointer',
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      fontWeight: 600,
                      fontSize: 15,
                      color: 'var(--ink)',
                    }}
                  >
                    {r.label}
                  </span>
                  <span style={{ display: 'block', fontSize: 12.5, color: 'var(--muted)' }}>
                    {r.blurb}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {isSignup && (
        <div>
          <label style={labelStyle} htmlFor="cf-name">
            Name
          </label>
          <input
            id="cf-name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={fieldStyle}
          />
        </div>
      )}

      <div>
        <label style={labelStyle} htmlFor="cf-email">
          Email
        </label>
        <input
          id="cf-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={fieldStyle}
        />
      </div>

      <div>
        <label style={labelStyle} htmlFor="cf-password">
          Password
        </label>
        <input
          id="cf-password"
          type="password"
          autoComplete={isSignup ? 'new-password' : 'current-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={fieldStyle}
        />
      </div>

      {error && (
        <p style={{ fontSize: 13, color: 'var(--danger, #b3261e)', margin: 0 }}>{error}</p>
      )}

      <Btn type="submit" variant="primary" size="lg" full disabled={submitting}>
        {submitting ? '…' : isSignup ? 'Create account' : 'Sign in'}
      </Btn>

      <p style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', margin: 0 }}>
        {isSignup ? (
          <>
            Already have an account?{' '}
            <Link href="/signin" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
              Sign in
            </Link>
          </>
        ) : (
          <>
            New here?{' '}
            <Link href="/signup" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
              Create an account
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
