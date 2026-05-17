'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

type CookDetail = {
  userId: string;
  story: string | null;
  neighborhood: string | null;
  cuisineTags: string[];
  idDocUrl: string | null;
  idStatus: string;
  foodHandlerCertUrl: string | null;
  foodHandlerCertExpiresAt: string | null;
  foodHandlerCertStatus: string;
  dshsRegistrationUrl: string | null;
  dshsRegistrationStatus: string;
  approvedAt: string | null;
  annualGmvCents: number;
  rejectedReason: string | null;
  user: { name: string | null; email: string; status: string };
};

export default function AdminCookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [cook, setCook] = useState<CookDetail | null>(null);

  const load = async () => {
    const res = await fetch(`/api/admin/cooks?status=all`);
    if (res.ok) {
      const c = ((await res.json()).cooks ?? []).find((x: CookDetail) => x.userId === id);
      setCook(c ?? null);
    }
  };
  useEffect(() => {
    load();
  }, [id]);

  const approveCook = async () => {
    if (!confirm('Approve this cook?')) return;
    await fetch(`/api/admin/cooks/${id}/approve`, { method: 'POST' });
    await load();
  };
  const rejectCook = async () => {
    const reason = prompt('Reject reason?');
    if (!reason) return;
    await fetch(`/api/admin/cooks/${id}/reject`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    await load();
  };
  const approveDshs = async () => {
    if (!confirm('Approve DSHS registration? This will auto-activate any pending TCS dishes.')) return;
    await fetch(`/api/admin/cooks/${id}/dshs/approve`, { method: 'POST' });
    await load();
  };
  const rejectDshs = async () => {
    const reason = prompt('Reject DSHS reason?');
    if (!reason) return;
    await fetch(`/api/admin/cooks/${id}/dshs/reject`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    await load();
  };
  const suspend = async () => {
    if (!confirm('Suspend this cook?')) return;
    await fetch(`/api/admin/users/${id}/suspend`, { method: 'POST' });
    await load();
  };
  const unsuspend = async () => {
    await fetch(`/api/admin/users/${id}/unsuspend`, { method: 'POST' });
    await load();
  };

  if (!cook) return <main className="p-8">Loading…</main>;

  return (
    <main className="min-h-screen bg-[var(--color-surface-0)]">
      <header className="border-b bg-[var(--color-surface-1)]">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/admin/cooks" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
            ← Cooks
          </Link>
        </div>
      </header>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{cook.user.name}</h1>
          <p className="text-[var(--color-text-secondary)]">{cook.user.email}</p>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-1">Status: {cook.user.status}</p>
        </div>

        <Card>
          <h2 className="font-semibold mb-2">Profile</h2>
          <p className="text-sm">{cook.story}</p>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-2">
            {cook.neighborhood} · {cook.cuisineTags.join(', ')}
          </p>
          {cook.approvedAt && (
            <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
              Annual GMV: ${(cook.annualGmvCents / 100).toLocaleString()}
            </p>
          )}
        </Card>

        <Card>
          <h2 className="font-semibold mb-3">Documents</h2>
          <div className="space-y-3 text-sm">
            <DocRow label="Government ID" url={cook.idDocUrl} status={cook.idStatus} />
            <DocRow
              label="Food handler cert"
              url={cook.foodHandlerCertUrl}
              status={cook.foodHandlerCertStatus}
              extra={
                cook.foodHandlerCertExpiresAt
                  ? `expires ${new Date(cook.foodHandlerCertExpiresAt).toLocaleDateString()}`
                  : undefined
              }
            />
            <DocRow
              label="DSHS registration (TCS)"
              url={cook.dshsRegistrationUrl}
              status={cook.dshsRegistrationStatus}
            />
          </div>
        </Card>

        {!cook.approvedAt && (
          <Card>
            <h2 className="font-semibold mb-2">Initial approval</h2>
            <div className="flex gap-2">
              <Button onClick={approveCook}>Approve cook</Button>
              <Button variant="danger" onClick={rejectCook}>Reject</Button>
            </div>
            {cook.rejectedReason && (
              <p className="text-sm text-red-700 mt-2">Reason on file: {cook.rejectedReason}</p>
            )}
          </Card>
        )}

        {cook.dshsRegistrationStatus === 'PENDING' && (
          <Card className="bg-blue-500/15 border-blue-200">
            <h2 className="font-semibold mb-2">DSHS registration review</h2>
            <p className="text-xs text-[var(--color-text-secondary)] mb-2">
              Approving will auto-activate any TCS dishes this cook has pending.
            </p>
            <div className="flex gap-2">
              <Button onClick={approveDshs}>Approve DSHS</Button>
              <Button variant="danger" onClick={rejectDshs}>Reject DSHS</Button>
            </div>
          </Card>
        )}

        {cook.approvedAt && (
          <Card>
            <h2 className="font-semibold mb-2">Account actions</h2>
            {cook.user.status === 'SUSPENDED' ? (
              <Button onClick={unsuspend}>Reinstate</Button>
            ) : (
              <Button variant="danger" onClick={suspend}>Suspend</Button>
            )}
          </Card>
        )}
      </div>
    </main>
  );
}

function DocRow({
  label,
  url,
  status,
  extra,
}: {
  label: string;
  url: string | null;
  status: string;
  extra?: string;
}) {
  return (
    <div className="flex justify-between items-start gap-3">
      <div>
        <p className="font-medium">{label}</p>
        {url ? (
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-brand-400 underline text-xs">
            View document
          </a>
        ) : (
          <p className="text-xs text-[var(--color-text-tertiary)]">Not uploaded</p>
        )}
        {extra && <p className="text-xs text-[var(--color-text-tertiary)]">{extra}</p>}
      </div>
      <span
        className={`text-xs px-2 py-1 rounded ${
          status === 'APPROVED'
            ? 'bg-emerald-500/15 text-emerald-700'
            : status === 'PENDING'
              ? 'bg-amber-500/15 text-amber-700'
              : status === 'REJECTED'
                ? 'bg-red-500/15 text-red-700'
                : 'bg-[var(--color-surface-2)] text-[var(--color-text-tertiary)]'
        }`}
      >
        {status}
      </span>
    </div>
  );
}
