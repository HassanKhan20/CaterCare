'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Btn } from '@/components/ui/Btn';
import { Icon } from '@/components/ui/Icon';
import { PriceTag } from '@/components/ui/PriceTag';
import { PaymentStep } from '@/components/buyer/PaymentStep';
import { loadCart, type Cart } from '@/lib/cart';

type Address = {
  id: string;
  label: string;
  line1: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
};

type Quote = {
  financials: {
    subtotalCents: number;
    buyerServiceFeeCents: number;
    deliveryFeeCents: number;
    driverTipCents: number;
    cookCommissionCents: number;
    driverBasePayCents: number;
  };
  distanceMiles: number;
  containsTcs: boolean;
  disclosureText: string;
};

type TimeOption = { id: string; t: string; note: string; iso: string };

function buildTimeOptions(): TimeOption[] {
  const now = new Date();
  const todayEvening = new Date(now);
  todayEvening.setHours(18, 30, 0, 0);
  const todayLater = new Date(now);
  todayLater.setHours(19, 30, 0, 0);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(12, 30, 0, 0);
  // If today's slots are in the past, push them all to tomorrow + 1 day
  if (todayEvening < now) {
    todayEvening.setDate(todayEvening.getDate() + 1);
    todayLater.setDate(todayLater.getDate() + 1);
    tomorrow.setDate(tomorrow.getDate() + 1);
  }
  const fmt = (d: Date) =>
    d.toLocaleString('en-US', {
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  return [
    { id: 'a', t: fmt(todayEvening), note: 'fastest', iso: todayEvening.toISOString() },
    { id: 'b', t: fmt(todayLater), note: 'evening', iso: todayLater.toISOString() },
    { id: 'c', t: fmt(tomorrow), note: 'lunch', iso: tomorrow.toISOString() },
  ];
}

export default function CheckoutPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [tipPct, setTipPct] = useState<number>(15);
  const [timeOpts] = useState<TimeOption[]>(() => buildTimeOptions());
  const [timeId, setTimeId] = useState<string>('a');
  const [accepted, setAccepted] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Set once the order + PaymentIntent exist; flips the page to the card step.
  const [payment, setPayment] = useState<{ clientSecret: string; orderId: string } | null>(
    null,
  );

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) setCart(loadCart());
    });
    void (async () => {
      const res = await fetch('/api/buyer/addresses');
      if (!res.ok || !active) return;
      const list: Address[] = (await res.json()).addresses ?? [];
      if (!active) return;
      setAddresses(list);
      if (list[0]) setSelectedAddressId(list[0].id);
    })();
    return () => {
      active = false;
    };
  }, []);

  const subtotalCents = cart?.items.reduce((s, i) => s + i.priceCents * i.qty, 0) ?? 0;
  const tipCents = Math.round((subtotalCents * tipPct) / 100);

  const fetchQuote = useCallback(async () => {
    if (!cart?.cookId || !selectedAddressId) return;
    const res = await fetch('/api/orders/quote', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        cookId: cart.cookId,
        items: cart.items.map((i) => ({ dishId: i.dishId, quantity: i.qty })),
        deliveryAddressId: selectedAddressId,
        tipCents,
      }),
    });
    if (res.ok) setQuote(await res.json());
  }, [cart, selectedAddressId, tipCents]);

  useEffect(() => {
    queueMicrotask(fetchQuote);
  }, [fetchQuote]);

  const placeOrder = async () => {
    if (!cart?.cookId || !selectedAddressId || !accepted) return;
    const selected = timeOpts.find((t) => t.id === timeId)!;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          cookId: cart.cookId,
          items: cart.items.map((i) => ({ dishId: i.dishId, quantity: i.qty })),
          deliveryAddressId: selectedAddressId,
          tipCents,
          requestedDeliveryAt: selected.iso,
          homeKitchenDisclosureAccepted: true,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Failed to create order');
        return;
      }
      if (!json.clientSecret) {
        setError('Payment could not be initialized. Please try again.');
        return;
      }
      // Order created in DRAFT + PaymentIntent ready — advance to the card step.
      setPayment({ clientSecret: json.clientSecret, orderId: json.orderId });
    } finally {
      setSubmitting(false);
    }
  };

  if (!cart || cart.items.length === 0) {
    return (
      <main className="cc-page cc-page-narrow">
        <p className="cc-page-sub">Your basket is empty.</p>
        <Link href="/browse">
          <Btn variant="primary">Browse cooks</Btn>
        </Link>
      </main>
    );
  }

  const totals = quote
    ? {
        subtotal: quote.financials.subtotalCents,
        serviceFee: quote.financials.buyerServiceFeeCents,
        delivery: quote.financials.deliveryFeeCents,
        tip: quote.financials.driverTipCents,
      }
    : { subtotal: subtotalCents, serviceFee: 0, delivery: 0, tip: tipCents };
  const total = totals.subtotal + totals.serviceFee + totals.delivery + totals.tip;
  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  // Payment step — card collection via Stripe Elements
  if (payment) {
    return (
      <main className="cc-page cc-page-narrow">
        <button type="button" className="cc-back" onClick={() => setPayment(null)}>
          <Icon name="arrow-left" size={14} /> Back to order
        </button>
        <header style={{ paddingTop: 16, paddingBottom: 24 }}>
          <span className="cc-eye">Payment</span>
          <h1 className="cc-page-title" style={{ marginTop: 8 }}>
            How you&apos;ll pay
          </h1>
          <p className="cc-page-sub" style={{ marginTop: 8 }}>
            <PriceTag cents={total} /> total · charged when you confirm
          </p>
        </header>
        <PaymentStep
          clientSecret={payment.clientSecret}
          orderId={payment.orderId}
          totalCents={total}
        />
        <p
          className="cc-mono"
          style={{ fontSize: 11, color: 'var(--muted)', marginTop: 16, textAlign: 'center' }}
        >
          Test card 4242 4242 4242 4242 · any future date · any CVC
        </p>
      </main>
    );
  }

  return (
    <main className="cc-page cc-page-narrow">
      <Link href="/cart" className="cc-back">
        <Icon name="arrow-left" size={14} /> Basket
      </Link>

      <header style={{ paddingTop: 16, paddingBottom: 24 }}>
        <span className="cc-eye">Final step</span>
        <h1 className="cc-page-title" style={{ marginTop: 8 }}>
          Confirm your order
        </h1>
      </header>

      <div className="cc-co-grid" style={{ padding: 0 }}>
        <div className="cc-co-section">
          <h4>Deliver to</h4>
          {addresses.length === 0 ? (
            <div className="cc-co-row">
              <Icon name="pin" size={15} />
              <span>
                No address on file.{' '}
                <Link href="/account" className="cc-link-sm">
                  Add one →
                </Link>
              </span>
            </div>
          ) : (
            <div className="cc-co-row">
              <Icon name="pin" size={15} />
              <select
                value={selectedAddressId}
                onChange={(e) => setSelectedAddressId(e.target.value)}
                style={{
                  flex: 1,
                  border: 0,
                  background: 'transparent',
                  fontSize: 14,
                  color: 'var(--ink-2)',
                  cursor: 'pointer',
                }}
              >
                {addresses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label} — {a.line1}, {a.city}
                  </option>
                ))}
              </select>
              <Link href="/account" className="cc-link-sm">
                Change
              </Link>
            </div>
          )}
        </div>

        <div className="cc-co-section">
          <h4>When</h4>
          <div className="cc-co-times">
            {timeOpts.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setTimeId(o.id)}
                className={`cc-co-time ${timeId === o.id ? 'is-on' : ''}`}
              >
                <span className="cc-co-time-t">{o.t}</span>
                <span className="cc-co-time-n">{o.note}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="cc-co-section">
          <h4>Driver tip</h4>
          <div className="cc-co-times">
            {[10, 15, 20].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setTipPct(p)}
                className={`cc-co-time ${tipPct === p ? 'is-on' : ''}`}
              >
                <span className="cc-co-time-t">{p}%</span>
                <span className="cc-co-time-n">100% to driver</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="cc-co-totals" style={{ margin: '24px -32px 0' }}>
        <TotalLine label="Subtotal" value={totals.subtotal} />
        <TotalLine label="Service fee" value={totals.serviceFee} sub="9% — vs. ~30% on apps" />
        <TotalLine label="Delivery" value={totals.delivery} />
        <TotalLine label="Driver tip" value={totals.tip} />
        <div className="cc-total-divider" />
        <TotalLine label="Total" value={total} large />
      </div>

      <label className="cc-disclosure-box" style={{ paddingLeft: 0, paddingRight: 0 }}>
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
        />
        <span>
          <strong>Home-kitchen disclosure.</strong>{' '}
          {quote?.disclosureText ??
            'I understand this food is prepared in a private home licensed under Texas SB 541 — not in a commercial restaurant kitchen.'}
        </span>
      </label>

      {error && (
        <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: 12 }}>{error}</p>
      )}

      <div style={{ marginTop: 24 }}>
        <Btn
          variant="primary"
          size="lg"
          full
          iconAfter="arrow-right"
          disabled={!accepted || !selectedAddress || submitting}
          onClick={placeOrder}
        >
          {submitting ? 'Starting payment…' : 'Continue to payment · '}
          <PriceTag cents={total} />
        </Btn>
      </div>
    </main>
  );
}

function TotalLine({
  label,
  value,
  sub,
  large,
}: {
  label: string;
  value: number;
  sub?: string;
  large?: boolean;
}) {
  return (
    <div className={`cc-total-line ${large ? 'is-large' : ''}`}>
      <div className="cc-total-label">
        {label}
        {sub && <span className="cc-total-sub">{sub}</span>}
      </div>
      <div className="cc-total-val cc-mono">${(value / 100).toFixed(2)}</div>
    </div>
  );
}
