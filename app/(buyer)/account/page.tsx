'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Btn } from '@/components/ui/Btn';
import { Icon } from '@/components/ui/Icon';

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

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  fontSize: 14,
  border: '1px solid var(--line)',
  borderRadius: 4,
  background: 'var(--surface)',
  color: 'var(--ink)',
  fontFamily: 'inherit',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--f-mono)',
  fontSize: 11,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
  marginBottom: 6,
};

export default function AccountPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

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
  useEffect(() => {
    load();
  }, []);

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
        setError('Could not find this address. Please double-check.');
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
    <main className="cc-page cc-page-narrow">
      <h1 className="cc-page-title">Account</h1>
      <p className="cc-page-sub">Manage your delivery addresses</p>

      <div className="cc-account-grid" style={{ marginBottom: 32 }}>
        <article className="cc-acc-card">
          <h4>Addresses</h4>
          <p>
            {loading ? 'Loading…' : `${addresses.length} saved`}
            {addresses.find((a) => a.isDefault) ? ` · ${addresses.find((a) => a.isDefault)!.label} (default)` : ''}
          </p>
          {!adding && (
            <Link href="#addresses" className="cc-link-sm" onClick={() => setAdding(true)}>
              + Add new →
            </Link>
          )}
        </article>
        <article className="cc-acc-card">
          <h4>Payment methods</h4>
          <p>Card on file at checkout (Stripe).</p>
          <Link href="/checkout" className="cc-link-sm">
            Manage at checkout →
          </Link>
        </article>
        <article className="cc-acc-card">
          <h4>Dietary notes</h4>
          <p>Add notes per order from the dish detail page.</p>
        </article>
        <article className="cc-acc-card">
          <h4>Notifications</h4>
          <p>Order updates by email.</p>
        </article>
      </div>

      {/* Saved addresses list */}
      <section id="addresses">
        <h2
          className="cc-section-title"
          style={{ fontSize: 28, marginBottom: 20 }}
        >
          Saved addresses
        </h2>

        {loading ? (
          <p className="cc-muted">Loading addresses…</p>
        ) : addresses.length === 0 && !adding ? (
          <p className="cc-muted">
            No addresses yet.{' '}
            <button type="button" className="cc-link-sm" onClick={() => setAdding(true)}>
              Add your first →
            </button>
          </p>
        ) : (
          <div>
            {addresses.map((a) => (
              <article key={a.id} className="cc-order" style={{ paddingTop: 20, paddingBottom: 20 }}>
                <div>
                  <div className="cc-mono cc-muted" style={{ marginBottom: 6 }}>
                    <Icon name="pin" size={11} /> {a.label}
                    {a.isDefault ? ' · DEFAULT' : ''}
                  </div>
                  <h4 style={{ fontSize: 18, fontWeight: 600, margin: '4px 0' }}>
                    {a.line1}
                    {a.line2 ? `, ${a.line2}` : ''}
                  </h4>
                  <span className="cc-muted" style={{ fontSize: 13 }}>
                    {a.city}, {a.state} {a.zip}
                  </span>
                </div>
                <div className="cc-order-right">
                  <button
                    type="button"
                    className="cc-link-sm"
                    onClick={() => deleteAddress(a.id)}
                    disabled={deleting === a.id}
                    style={{ color: 'var(--danger)' }}
                  >
                    {deleting === a.id ? 'Removing…' : 'Remove'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Add address form */}
        {adding ? (
          <div
            style={{
              marginTop: 24,
              padding: 28,
              border: '1px solid var(--line)',
              background: 'var(--surface)',
              borderRadius: 4,
            }}
          >
            <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 22, fontWeight: 600, marginTop: 0 }}>
              New address
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
              <div>
                <label style={labelStyle}>Label (e.g. Home, Work)</label>
                <input style={inputStyle} placeholder="Home" value={label} onChange={(e) => setLabel(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Street address</label>
                <input style={inputStyle} placeholder="123 Main St" value={line1} onChange={(e) => setLine1(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Apt / Suite (optional)</label>
                <input style={inputStyle} placeholder="Apt 4B" value={line2} onChange={(e) => setLine2(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>City</label>
                  <input style={inputStyle} placeholder="Plano" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>State</label>
                  <select style={inputStyle} value={stateCode} onChange={(e) => setStateCode(e.target.value)}>
                    {US_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>ZIP</label>
                  <input style={inputStyle} placeholder="75024" value={zip} onChange={(e) => setZip(e.target.value)} maxLength={10} />
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink-2)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  style={{ accentColor: 'var(--accent)' }}
                />
                Set as default delivery address
              </label>
              {error && (
                <p
                  style={{
                    fontSize: 13,
                    color: 'var(--danger)',
                    padding: '10px 14px',
                    background: 'color-mix(in oklab, var(--danger) 8%, transparent)',
                    border: '1px solid color-mix(in oklab, var(--danger) 30%, transparent)',
                    borderRadius: 4,
                    margin: 0,
                  }}
                >
                  {error}
                </p>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <Btn variant="primary" onClick={saveAddress} disabled={submitting}>
                  {submitting ? 'Saving…' : 'Save address'}
                </Btn>
                <Btn variant="ghost" onClick={resetForm}>
                  Cancel
                </Btn>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 24 }}>
            <Btn variant="secondary" onClick={() => setAdding(true)}>
              + Add new address
            </Btn>
          </div>
        )}
      </section>
    </main>
  );
}
