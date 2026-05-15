'use client';
import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

type DriverDetail = {
  userId: string;
  licenseDocUrl: string | null;
  licenseExpiresAt: string | null;
  insuranceDocUrl: string | null;
  insuranceExpiresAt: string | null;
  idDocUrl: string | null;
  carPhotoUrl: string | null;
  thermalBagPhotoUrl: string | null;
  thermalBagAcknowledged: boolean;
  docsStatus: string;
  backgroundCheckStatus: string;
  approvedAt: string | null;
  rejectedReason: string | null;
  user: { name: string | null; email: string; status: string };
};

export default function AdminDriverDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [driver, setDriver] = useState<DriverDetail | null>(null);

  const load = async () => {
    const res = await fetch('/api/admin/drivers?status=all');
    if (res.ok) {
      const d = ((await res.json()).drivers ?? []).find((x: DriverDetail) => x.userId === id);
      setDriver(d ?? null);
    }
  };
  useEffect(() => {
    load();
  }, [id]);

  const approve = async () => {
    await fetch(`/api/admin/drivers/${id}/approve`, { method: 'POST' });
    await load();
  };
  const reject = async () => {
    const reason = prompt('Reject reason?');
    if (!reason) return;
    await fetch(`/api/admin/drivers/${id}/reject`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    await load();
  };
  const bgCheck = async (result: 'APPROVED' | 'REJECTED') => {
    await fetch(`/api/admin/drivers/${id}/bg-check`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ result }),
    });
    await load();
  };
  const suspend = async () => {
    if (!confirm('Suspend this driver?')) return;
    await fetch(`/api/admin/users/${id}/suspend`, { method: 'POST' });
    await load();
  };
  const unsuspend = async () => {
    await fetch(`/api/admin/users/${id}/unsuspend`, { method: 'POST' });
    await load();
  };

  if (!driver) return <main className="p-8">Loading…</main>;

  return (
    <main className="min-h-screen bg-[var(--color-surface-0)]">
      <header className="border-b bg-[var(--color-surface-1)]">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/admin/drivers" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
            ← Drivers
          </Link>
        </div>
      </header>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">
            {driver.user.name}
            {driver.thermalBagPhotoUrl && (
              <span className="ml-3 text-xs bg-emerald-500/15 text-emerald-300 px-2 py-1 rounded-full">
                ✓ Verified Bag
              </span>
            )}
          </h1>
          <p className="text-[var(--color-text-secondary)]">{driver.user.email}</p>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-1">Status: {driver.user.status}</p>
        </div>

        <Card>
          <h2 className="font-semibold mb-3">Verification documents</h2>
          <div className="space-y-3 text-sm">
            <DocRow
              label="Driver's license"
              url={driver.licenseDocUrl}
              extra={
                driver.licenseExpiresAt
                  ? `expires ${new Date(driver.licenseExpiresAt).toLocaleDateString()}`
                  : undefined
              }
            />
            <DocRow
              label="Auto insurance"
              url={driver.insuranceDocUrl}
              extra={
                driver.insuranceExpiresAt
                  ? `expires ${new Date(driver.insuranceExpiresAt).toLocaleDateString()}`
                  : undefined
              }
            />
            <DocRow label="Government ID" url={driver.idDocUrl} />
            <DocRow label="Car photo" url={driver.carPhotoUrl} />
            {driver.thermalBagPhotoUrl && (
              <DocRow label="Thermal bag photo" url={driver.thermalBagPhotoUrl} />
            )}
          </div>
        </Card>

        {driver.docsStatus === 'PENDING' && !driver.approvedAt && (
          <Card>
            <h2 className="font-semibold mb-2">Doc review</h2>
            <div className="flex gap-2">
              <Button onClick={approve}>Approve documents</Button>
              <Button variant="danger" onClick={reject}>Reject</Button>
            </div>
            {driver.rejectedReason && (
              <p className="text-sm text-red-300 mt-2">Reason on file: {driver.rejectedReason}</p>
            )}
          </Card>
        )}

        <Card>
          <h2 className="font-semibold mb-2">Background check</h2>
          <p className="text-sm mb-3">Status: {driver.backgroundCheckStatus}</p>
          {driver.backgroundCheckStatus !== 'APPROVED' && (
            <div className="flex gap-2">
              <Button onClick={() => bgCheck('APPROVED')}>Mark approved</Button>
              <Button variant="danger" onClick={() => bgCheck('REJECTED')}>Mark rejected</Button>
            </div>
          )}
        </Card>

        {driver.approvedAt && (
          <Card>
            <h2 className="font-semibold mb-2">Account actions</h2>
            {driver.user.status === 'SUSPENDED' ? (
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

function DocRow({ label, url, extra }: { label: string; url: string | null; extra?: string }) {
  return (
    <div className="flex justify-between items-start gap-3">
      <div>
        <p className="font-medium">{label}</p>
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-400 underline text-xs"
          >
            View document
          </a>
        ) : (
          <p className="text-xs text-[var(--color-text-tertiary)]">Not uploaded</p>
        )}
        {extra && <p className="text-xs text-[var(--color-text-tertiary)]">{extra}</p>}
      </div>
    </div>
  );
}
