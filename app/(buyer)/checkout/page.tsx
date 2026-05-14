'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
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

const TIP_PRESETS = [0, 10, 15, 20] as const;

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [tipPct, setTipPct] = useState<number>(15);
  const [requestedTime, setRequestedTime] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [disclosureAck, setDisclosureAck] = useState<boolean>(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCart(loadCart());
    fetch('/api/buyer/addresses')
      .then((r) => r.json())
      .then((j) => {
        setAddresses(j.addresses ?? []);
        const def = (j.addresses ?? []).find((a: Address & { isDefault?: boolean }) => a)?.id;
        if (def) setSelectedAddressId(def);
      });
    const inOneHour = new Date(Date.now() + 4 * 3600_000);
    setRequestedTime(inOneHour.toISOString().slice(0, 16));
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
    fetchQuote();
  }, [fetchQuote]);

  const placeOrder = async () => {
    if (!cart?.cookId || !selectedAddressId || !disclosureAck) return;
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
          requestedDeliveryAt: new Date(requestedTime).toISOString(),
          buyerNote: note || undefined,
          homeKitchenDisclosureAccepted: true,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Failed to create order');
        return;
      }
      // In production: redirect to Stripe Elements for payment confirmation.
      // For v1 demo, jump straight to success page.
      localStorage.removeItem('catercare:cart');
      router.push(`/checkout/success/${json.orderId}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!cart || cart.items.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="max-w-md text-center">
          <p>Your cart is empty.</p>
          <Link href="/browse">
            <Button className="mt-4">Browse cooks</Button>
          </Link>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="border-b bg-white">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <Link href="/cart" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
            ← Cart
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-3xl font-bold">Checkout</h1>

        <Card className="space-y-3">
          <h2 className="font-semibold">Delivery address</h2>
          {addresses.length === 0 ? (
            <p className="text-sm text-slate-600">
              Add an address in your <Link href="/account" className="text-brand-700 underline">account</Link>.
            </p>
          ) : (
            <select
              value={selectedAddressId}
              onChange={(e) => setSelectedAddressId(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-slate-300"
            >
              {addresses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label} — {a.line1}, {a.city}
                </option>
              ))}
            </select>
          )}
        </Card>

        <Card className="space-y-3">
          <h2 className="font-semibold">Delivery time</h2>
          <Input
            type="datetime-local"
            value={requestedTime}
            onChange={(e) => setRequestedTime(e.target.value)}
          />
        </Card>

        <Card className="space-y-3">
          <h2 className="font-semibold">Tip your driver</h2>
          <div className="flex gap-2">
            {TIP_PRESETS.map((p) => (
              <Button
                key={p}
                variant={tipPct === p ? 'primary' : 'secondary'}
                onClick={() => setTipPct(p)}
              >
                {p}%
              </Button>
            ))}
          </div>
          <p className="text-xs text-slate-500">100% goes to your driver.</p>
        </Card>

        <Card className="space-y-3">
          <h2 className="font-semibold">Note for cook (optional)</h2>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="No cilantro, extra spicy, etc."
            className="w-full px-3 py-2 rounded-md border border-slate-300"
            rows={2}
          />
        </Card>

        {quote && (
          <Card className="space-y-2">
            <h2 className="font-semibold">Order summary</h2>
            <Row label="Subtotal" cents={quote.financials.subtotalCents} />
            <Row label="Service fee" cents={quote.financials.buyerServiceFeeCents} />
            <Row label="Delivery" cents={quote.financials.deliveryFeeCents} />
            <Row label="Driver tip" cents={quote.financials.driverTipCents} />
            <div className="pt-2 border-t flex justify-between font-bold">
              <span>Total</span>
              <span>
                $
                {(
                  (quote.financials.subtotalCents +
                    quote.financials.buyerServiceFeeCents +
                    quote.financials.deliveryFeeCents +
                    quote.financials.driverTipCents) /
                  100
                ).toFixed(2)}
              </span>
            </div>
          </Card>
        )}

        {quote && (
          <Card className="bg-amber-50 border-amber-200">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={disclosureAck}
                onChange={(e) => setDisclosureAck(e.target.checked)}
                className="mt-1"
              />
              <span className="text-sm">
                <strong className="block mb-1">I acknowledge:</strong>
                {quote.disclosureText}
              </span>
            </label>
          </Card>
        )}

        {error && (
          <Card className="bg-red-50 border-red-200 text-red-700 text-sm">{error}</Card>
        )}

        <Button
          className="w-full"
          disabled={!quote || !disclosureAck || !selectedAddressId || submitting}
          onClick={placeOrder}
        >
          {submitting ? 'Placing order…' : 'Place order'}
        </Button>
      </div>
    </main>
  );
}

function Row({ label, cents }: { label: string; cents: number }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-600">{label}</span>
      <span>${(cents / 100).toFixed(2)}</span>
    </div>
  );
}
