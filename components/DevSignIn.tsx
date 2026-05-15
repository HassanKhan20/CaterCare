'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Btn } from '@/components/ui/Btn';

const SEEDED_USERS = [
  { email: 'admin@catercare.test', label: 'Admin', dest: '/admin' },
  { email: 'cook1@catercare.test', label: 'Cook 1 (Pakistani)', dest: '/cook' },
  { email: 'cook2@catercare.test', label: 'Cook 2 (Mexican)', dest: '/cook' },
  { email: 'cook3@catercare.test', label: 'Cook 3 (Ethiopian)', dest: '/cook' },
  { email: 'driver1@catercare.test', label: 'Driver 1', dest: '/driver' },
  { email: 'buyer1@catercare.test', label: 'Buyer 1', dest: '/browse' },
];

export function DevSignIn() {
  const [submitting, setSubmitting] = useState<string | null>(null);

  const signInAs = async (email: string, dest: string) => {
    setSubmitting(email);
    const result = await signIn('dev-credentials', {
      email,
      redirect: false,
    });
    if (result?.ok) {
      window.location.href = dest;
    } else {
      alert(`Failed: ${result?.error ?? 'unknown error'}`);
      setSubmitting(null);
    }
  };

  return (
    <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px dashed var(--line)' }}>
      <p
        className="cc-mono"
        style={{
          fontSize: 10.5,
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          margin: '0 0 4px',
        }}
      >
        Dev shortcuts
      </p>
      <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 16px' }}>
        Skip OAuth in local dev. Disabled in production.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {SEEDED_USERS.map((u) => (
          <Btn
            key={u.email}
            variant="secondary"
            size="sm"
            full
            onClick={() => signInAs(u.email, u.dest)}
            disabled={submitting !== null}
          >
            {submitting === u.email ? '…' : `Sign in as ${u.label}`}
          </Btn>
        ))}
      </div>
    </div>
  );
}
