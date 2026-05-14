'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function DriverOnboardingPage() {
  const router = useRouter();
  const [thermalAck, setThermalAck] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const start = async () => {
    if (!thermalAck) return;
    setSubmitting(true);
    await fetch('/api/driver/profile', { method: 'POST' });
    await fetch('/api/driver/thermal-bag', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ acknowledged: true }),
    });
    router.push('/driver/verification');
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/" className="text-xl font-bold text-brand-700">
            CaterCare
          </Link>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-3xl font-bold">Become a driver</h1>
        <Card className="space-y-3 text-sm">
          <h2 className="font-semibold">What you&apos;ll need</h2>
          <ul className="list-disc list-inside space-y-1 text-slate-700">
            <li>Valid driver&apos;s license</li>
            <li>Personal auto insurance card</li>
            <li>Government-issued ID</li>
            <li>A photo of your vehicle</li>
            <li>An insulated food delivery bag (minimum 13&quot; × 13&quot; × 10&quot;)</li>
            <li>A bank account or debit card for payouts</li>
          </ul>
          <p className="text-xs text-slate-500 italic">
            By proceeding you confirm you are an independent contractor, that your personal
            auto insurance excludes commercial delivery, and that you accept full
            responsibility for maintaining valid coverage.
          </p>
        </Card>

        <Card>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={thermalAck}
              onChange={(e) => setThermalAck(e.target.checked)}
              className="mt-1"
            />
            <span className="text-sm">
              I confirm I own (or will obtain before my first delivery) a professional
              insulated food delivery bag of at least 13&quot; × 13&quot; × 10&quot;.
            </span>
          </label>
        </Card>

        <Button className="w-full" onClick={start} disabled={!thermalAck || submitting}>
          {submitting ? '…' : 'Continue to verification'}
        </Button>
      </div>
    </main>
  );
}
