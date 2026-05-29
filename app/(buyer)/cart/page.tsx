'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Btn } from '@/components/ui/Btn';
import { Icon } from '@/components/ui/Icon';
import { PriceTag } from '@/components/ui/PriceTag';
import {
  loadCart,
  saveCart,
  setQuantity,
  removeFromCart,
  cartSubtotalCents,
  emptyCart,
  type Cart,
} from '@/lib/cart';

// Buyer service-fee % for the cart preview. The authoritative numbers
// (incl. distance-based delivery + tip) come from /api/orders/quote at
// checkout once an address is selected — the cart can't know those yet.
const SERVICE_FEE_PCT = 9;

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart>(emptyCart());

  useEffect(() => {
    queueMicrotask(() => setCart(loadCart()));
  }, []);

  const update = (next: Cart) => {
    setCart(next);
    saveCart(next);
  };

  if (cart.items.length === 0) {
    return (
      <main className="cc-page cc-page-narrow">
        <Link href="/browse" className="cc-back">
          <Icon name="arrow-left" size={14} /> Browse cooks
        </Link>
        <div className="cc-empty" style={{ minHeight: '50vh' }}>
          <div className="cc-empty-art" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="bag" size={60} />
          </div>
          <h4>Nothing here yet.</h4>
          <p>Tap a dish on a cook&apos;s menu to add it.</p>
          <div style={{ marginTop: 24 }}>
            <Link href="/browse">
              <Btn variant="primary">Browse cooks</Btn>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const subtotal = cartSubtotalCents(cart);
  const serviceFee = Math.round((subtotal * SERVICE_FEE_PCT) / 100);

  return (
    <main className="cc-page cc-page-narrow">
      <Link href="/browse" className="cc-back">
        <Icon name="arrow-left" size={14} /> Keep browsing
      </Link>

      <h1 className="cc-page-title">
        Your basket{' '}
        {cart.cookName && (
          <span className="cc-mono" style={{ fontSize: 14, color: 'var(--muted)' }}>
            · {cart.cookName}
          </span>
        )}
      </h1>

      {/* Items */}
      <div style={{ marginTop: 24 }}>
        {cart.items.map((item) => (
          <div key={item.dishId} className="cc-cart-item">
            <div className="cc-cart-img">
              {item.photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.photoUrl} alt={item.name} />
              )}
            </div>
            <div className="cc-cart-body">
              <h5>{item.name}</h5>
              <div className="cc-cart-meta cc-mono">
                ${(item.priceCents / 100).toFixed(2)} each
              </div>
              <div className="cc-cart-controls">
                <div className="cc-qty cc-qty-sm">
                  <button
                    type="button"
                    onClick={() => update(setQuantity(cart, item.dishId, item.qty - 1))}
                    aria-label="Decrease"
                  >
                    <Icon name="minus" size={12} />
                  </button>
                  <span>{item.qty}</span>
                  <button
                    type="button"
                    onClick={() => update(setQuantity(cart, item.dishId, item.qty + 1))}
                    aria-label="Increase"
                  >
                    <Icon name="plus" size={12} />
                  </button>
                </div>
                <button
                  type="button"
                  className="cc-cart-remove"
                  onClick={() => update(removeFromCart(cart, item.dishId))}
                >
                  Remove
                </button>
              </div>
            </div>
            <div className="cc-cart-price">
              <PriceTag cents={item.priceCents * item.qty} />
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="cc-drawer-foot" style={{ margin: '32px -32px 0', borderRadius: 4 }}>
        <div className="cc-totals">
          <TotalLine label="Subtotal" value={subtotal} />
          <TotalLine label={`Service fee (${SERVICE_FEE_PCT}%)`} value={serviceFee} sub="vs. ~30% on apps" />
          <div className="cc-total-line">
            <div className="cc-total-label">
              Delivery &amp; tip
              <span className="cc-total-sub">calculated at checkout</span>
            </div>
            <div className="cc-total-val cc-mono">—</div>
          </div>
          <div className="cc-total-divider" />
          <TotalLine label="Estimated so far" value={subtotal + serviceFee} large />
        </div>
        <p className="cc-disclosure">
          <Icon name="shield" size={13} /> Home-kitchen disclosure: this food is prepared in a private home licensed under Texas SB&nbsp;541.
        </p>
        <Btn
          variant="primary"
          size="lg"
          full
          iconAfter="arrow-right"
          onClick={() => router.push('/checkout')}
        >
          Continue to checkout
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
