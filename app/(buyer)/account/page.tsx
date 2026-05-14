'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';

type Address = {
  id: string;
  label: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  zip: string;
  isDefault: boolean;
};

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY',
  'LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND',
  'OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
];

function AddressSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {[0, 1].map((i) => (
        <div key={i} className="h-20 rounded-xl bg-slate-200" />
      ))}
    </div>
  );
}

export default function AccountPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // form fields
  const [label, setLabel] = useState('');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [stateCode, setStateCode] = useState('TX');
  const [zip, setZip] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/buyer/addresses');
    if (res.ok) setAddresses((await res.json()).addresses ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const deleteAddress = async (id: string) => {
    setDeleting(id);
    await fetch(`/api/buyer/addresses/${id}`, { method: 'DELETE' });
    setAddresses((a) => a.filter((x) => x.id !== id));
    setDeleting(null);
  };

  const resetForm = () => {
    setLabel(''); setLine1(''); setLine2(''); setCity('');
    setStateCode('TX'); setZip(''); setIsDefault(false);
    setError(null); setAdding(false);
  };

  const saveAddress = async () => {
    if (!label.trim() || !line1.trim() || !city.trim() || !zip.trim()) {
      setError('Label, street, city, and ZIP are required.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const fullAddress = `${line1}, ${city}, ${stateCode} ${zip}`;
      const geoRes = await fetch(`/api/geocode?q=${encodeURIComponent(fullAddress)}`);
      if (!geoRes.ok) {
        setError('Could not find this address. Please double-check and try again.');
        return;
      }
      const { lat, lng } = await geoRes.json();
      const res = await fetch('/api/buyer/addresses', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          label: label.trim(),
          line1: line1.trim(),
          ...(line2.trim() ? { line2: line2.trim() } : {}),
          city: city.trim(),
          state: stateCode,
          zip: zip.trim(),
          lat,
          lng,
          isDefault,
        }),
      });
      if (!res.ok) {
        const j = await res.json();
        setError(j.error ?? 'Failed to save address.');
        return;
      }
      const { address } = await res.json();
      if (isDefault) {
        setAddresses((a) => [address, ...a.map((x) => ({ ...x, isDefault: false }))]);
      } else {
        setAddresses((a) => [...a, address]);
      }
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
        {/* Page header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Account</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your delivery addresses</p>
        </div>

        {/* Addresses section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Saved addresses</h2>
            {!adding && (
              <Button size="sm" variant="secondary" onClick={() => setAdding(true)}>
                + Add new
              </Button>
            )}
          </div>

          {loading ? (
            <AddressSkeleton />
          ) : addresses.length === 0 && !adding ? (
            <EmptyState
              icon="📍"
              title="No addresses yet"
              description="Add a delivery address to get started with checkout."
              action={
                <Button onClick={() => setAdding(true)}>Add your first address</Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {addresses.map((a) => (
                <Card key={a.id} className="flex items-start justify-between gap-4 py-4 px-5">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 text-brand-500 text-lg">📍</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900">{a.label}</p>
                        {a.isDefault && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-brand-50 text-brand-700 rounded-full font-medium">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mt-0.5">
                        {a.line1}{a.line2 ? `, ${a.line2}` : ''}
                      </p>
                      <p className="text-sm text-slate-500">
                        {a.city}, {a.state} {a.zip}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                    disabled={deleting === a.id}
                    onClick={() => deleteAddress(a.id)}
                  >
                    {deleting === a.id ? <Spinner className="w-4 h-4" /> : 'Remove'}
                  </Button>
                </Card>
              ))}
            </div>
          )}

          {/* Add address form */}
          {adding && (
            <Card className="mt-4 space-y-4">
              <h3 className="font-semibold text-slate-900">New address</h3>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Label <span className="text-slate-400 font-normal">(e.g. Home, Work)</span>
                </label>
                <Input
                  placeholder="Home"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Street address
                </label>
                <Input
                  placeholder="123 Main St"
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Apt / Suite <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <Input
                  placeholder="Apt 4B"
                  value={line2}
                  onChange={(e) => setLine2(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                  <Input
                    placeholder="Austin"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                  <select
                    value={stateCode}
                    onChange={(e) => setStateCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {US_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ZIP</label>
                  <Input
                    placeholder="78701"
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    maxLength={10}
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 accent-brand-500"
                />
                <span className="text-sm text-slate-700">Set as default delivery address</span>
              </label>

              {error && (
                <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <Button onClick={saveAddress} disabled={submitting} className="flex items-center gap-2">
                  {submitting && <Spinner className="w-4 h-4 border-white border-t-white/40" />}
                  {submitting ? 'Saving…' : 'Save address'}
                </Button>
                <Button variant="ghost" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </Card>
          )}
        </section>

        {/* Quick links */}
        <section className="pt-2 border-t border-slate-200">
          <div className="flex gap-6 text-sm text-slate-500">
            <Link href="/browse" className="hover:text-slate-900 transition-colors">
              Browse cooks
            </Link>
            <Link href="/orders" className="hover:text-slate-900 transition-colors">
              My orders
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
