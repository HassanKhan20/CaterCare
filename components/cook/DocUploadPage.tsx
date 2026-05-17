'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import type { UploadPurpose } from '@/lib/photo-upload';

type Props = {
  title: string;
  description: string;
  purpose: UploadPurpose;
  apiPath: string;
  requireExpiry?: boolean;
  expiryFieldName?: string; // e.g. "foodHandlerCertExpiresAt"
  fileFieldName: string; // e.g. "foodHandlerCertUrl"
  nextPath?: string;
};

export function DocUploadPage(props: Props) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [expiry, setExpiry] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!file) {
      setError('Please select a file.');
      return;
    }
    if (props.requireExpiry && !expiry) {
      setError('Please enter an expiry date.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const presignRes = await fetch('/api/uploads/presign', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ purpose: props.purpose, contentType: file.type }),
      });
      const { uploadUrl, publicUrl } = await presignRes.json();
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'content-type': file.type },
      });

      const body: Record<string, string> = { [props.fileFieldName]: publicUrl };
      if (props.requireExpiry && props.expiryFieldName) {
        body[props.expiryFieldName] = new Date(expiry).toISOString();
      }

      const res = await fetch(props.apiPath, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json();
        setError(j.error ?? 'Upload failed.');
        return;
      }
      router.push(props.nextPath ?? '/cook');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--color-surface-0)] text-[var(--color-text-primary)]">
      <header className="border-b border-[var(--color-surface-3)] bg-[var(--color-surface-1)]">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link
            href="/cook"
            className="text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
          >
            ← Dashboard
          </Link>
        </div>
      </header>
      <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-3xl font-bold">{props.title}</h1>
        <p className="text-[var(--color-text-secondary)]">{props.description}</p>

        <Card className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Upload document</label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-sm"
            />
            {file && (
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1">{file.name}</p>
            )}
          </div>
          {props.requireExpiry && (
            <div>
              <label className="block text-sm font-medium mb-1">Expiry date</label>
              <Input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
            </div>
          )}
        </Card>

        {error && <p className="text-sm text-[var(--color-danger,#A63A2C)]">{error}</p>}

        <Button className="w-full" onClick={submit} disabled={submitting}>
          {submitting ? 'Uploading…' : 'Submit'}
        </Button>
      </div>
    </main>
  );
}
