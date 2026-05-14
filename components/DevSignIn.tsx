'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/Button';

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
    <div className="pt-5 border-t border-dashed border-[var(--color-surface-3)]">
      <p className="text-xs font-semibold text-[#f5f1ec]/40 uppercase tracking-wider mb-1">
        Dev shortcuts
      </p>
      <p className="text-xs text-[#f5f1ec]/40 mb-3">
        Skip OAuth in local dev. Disabled in production.
      </p>
      <div className="space-y-2">
        {SEEDED_USERS.map((u) => (
          <Button
            key={u.email}
            variant="secondary"
            className="w-full text-left text-sm"
            onClick={() => signInAs(u.email, u.dest)}
            disabled={submitting !== null}
          >
            {submitting === u.email ? '…' : `Sign in as ${u.label}`}
          </Button>
        ))}
      </div>
    </div>
  );
}
