'use client';
import { useEffect, useState, use, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';

type OrderItem = { id: string; dishNameSnapshot: string; quantity: number };
type OrderDetail = {
  id: string;
  state: string;
  pickupAddressLine: string;
  deliveryAddressLine: string;
  driverBasePayCents: number;
  driverTipCents: number;
  driverPayoutCents: number;
  buyerNote: string | null;
  containsTcsItems: boolean;
  items: OrderItem[];
  cook: { name: string | null };
};

async function presignAndUpload(file: File): Promise<string> {
  const presignRes = await fetch('/api/uploads/presign', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      purpose: 'dropoff-confirm',
      contentType: file.type,
    }),
  });
  if (!presignRes.ok) throw new Error('Failed to get upload URL');
  const { uploadUrl, publicUrl } = await presignRes.json();
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'content-type': file.type },
  });
  if (!uploadRes.ok) throw new Error('Upload failed');
  return publicUrl as string;
}

export default function DriverJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const detailRes = await fetch(`/api/driver/orders/${id}`);
    if (detailRes.ok) setOrder((await detailRes.json()).order);
  };

  useEffect(() => { load(); }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setError(null);
  };

  const transition = async (to: 'PICKED_UP' | 'DELIVERED') => {
    if (!order) return;
    if (to === 'DELIVERED' && !photoFile) {
      setError('Please take a photo of the delivery before confirming.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      let photoUrl = 'https://placehold.co/600x400';
      if (to === 'DELIVERED' && photoFile) {
        photoUrl = await presignAndUpload(photoFile);
      }
      const res = await fetch(`/api/driver/jobs/${id}/transition`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ to, photoUrl }),
      });
      if (res.ok) {
        if (to === 'DELIVERED') {
          router.push('/driver/earnings');
        } else {
          setPhotoFile(null);
          setPhotoPreview(null);
          await load();
        }
      } else {
        const j = await res.json();
        setError(j.error ?? 'Failed to update order status.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!order) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--color-surface-0)]">
        <Spinner className="w-8 h-8" />
      </main>
    );
  }

  const isAssigned = order.state === 'DRIVER_ASSIGNED';
  const isPickedUp = order.state === 'PICKED_UP';

  return (
    <main className="min-h-screen bg-[var(--color-surface-0)]">
      <header className="border-b bg-[var(--color-surface-1)]">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <Link href="/driver/jobs" className="text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors">
            ← Jobs
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Delivery from {order.cook.name}</h1>
          <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
            {isAssigned ? 'Step 1: Pick up the order' : isPickedUp ? 'Step 2: Deliver to customer' : order.state}
          </p>
        </div>

        {/* Pay summary */}
        <Card className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[var(--color-text-tertiary)]">Your earnings</p>
            <p className="text-2xl font-bold text-brand-400">
              ${(order.driverPayoutCents / 100).toFixed(2)}
            </p>
          </div>
          <div className="text-right text-xs text-[var(--color-text-tertiary)]">
            <p>${(order.driverBasePayCents / 100).toFixed(2)} base</p>
            <p>+ ${(order.driverTipCents / 100).toFixed(2)} tip</p>
          </div>
        </Card>

        {/* Navigation step */}
        <Card className="space-y-2">
          <p className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wide font-medium">
            {isAssigned ? '① Pickup address' : '② Delivery address'}
          </p>
          <p className="font-semibold text-[var(--color-text-primary)]">
            {isAssigned ? order.pickupAddressLine : order.deliveryAddressLine}
          </p>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
              isAssigned ? order.pickupAddressLine : order.deliveryAddressLine,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-brand-400 hover:text-brand-800 font-medium transition-colors"
          >
            <span>Open in Google Maps</span>
            <span>→</span>
          </a>
        </Card>

        {/* Items */}
        <Card className="space-y-2">
          <p className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wide font-medium">Items</p>
          <ul className="space-y-1">
            {order.items.map((it) => (
              <li key={it.id} className="text-sm text-[var(--color-text-secondary)]">
                {it.quantity} × {it.dishNameSnapshot}
              </li>
            ))}
          </ul>
        </Card>

        {/* Warnings */}
        {order.buyerNote && (
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-3">
            <p className="text-sm text-amber-900">
              <strong>Buyer note:</strong> {order.buyerNote}
            </p>
          </div>
        )}
        {order.containsTcsItems && (
          <div className="rounded-xl bg-blue-500/15 border border-blue-200 px-4 py-3 text-sm text-blue-900">
            <strong>TCS items present.</strong> Keep in thermal bag — hand directly to recipient, do not leave at door.
          </div>
        )}

        {/* Delivery photo capture */}
        {isPickedUp && (
          <Card className="space-y-3">
            <p className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wide font-medium">
              Delivery photo <span className="text-red-400">*</span>
            </p>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Take a photo of the delivered order at the door before confirming.
            </p>
            {photoPreview ? (
              <div className="space-y-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoPreview}
                  alt="Delivery proof"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                  className="text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
                >
                  Retake photo
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 rounded-xl border-2 border-dashed border-[var(--color-surface-3)] hover:border-brand-400 hover:bg-brand-400/15 transition-all flex flex-col items-center justify-center gap-2 text-[var(--color-text-tertiary)] hover:text-brand-400"
              >
                <span className="text-3xl">📷</span>
                <span className="text-sm font-medium">Tap to take or choose a photo</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </Card>
        )}

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Action button */}
        {isAssigned && (
          <Button
            className="w-full flex items-center justify-center gap-2"
            onClick={() => transition('PICKED_UP')}
            disabled={submitting}
          >
            {submitting && <Spinner className="w-4 h-4 border-white border-t-white/40" />}
            {submitting ? 'Confirming…' : 'Confirm pickup'}
          </Button>
        )}
        {isPickedUp && (
          <Button
            className="w-full flex items-center justify-center gap-2"
            onClick={() => transition('DELIVERED')}
            disabled={submitting || !photoFile}
          >
            {submitting && <Spinner className="w-4 h-4 border-white border-t-white/40" />}
            {submitting ? 'Uploading & confirming…' : 'Confirm delivery'}
          </Button>
        )}
      </div>
    </main>
  );
}
