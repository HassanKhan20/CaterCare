'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Btn } from '@/components/ui/Btn';
import { Icon } from '@/components/ui/Icon';
import { PriceTag } from '@/components/ui/PriceTag';
import {
  loadCart,
  saveCart,
  addToCart,
  emptyCart,
  DifferentCookError,
  type CartItem,
} from '@/lib/cart';

type Props = {
  cookId: string;
  cookName: string;
  dishId: string;
  name: string;
  priceCents: number;
  photoUrl?: string | null;
};

export function AddToCartButton(props: Props) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [confirming, setConfirming] = useState(false);

  const tryAdd = (force: boolean) => {
    let cart = loadCart();
    if (force) cart = emptyCart();
    try {
      const item: CartItem & { cookName: string } = {
        cookId: props.cookId,
        cookName: props.cookName,
        dishId: props.dishId,
        name: props.name,
        priceCents: props.priceCents,
        qty,
        photoUrl: props.photoUrl,
      };
      const updated = addToCart(cart, item);
      saveCart(updated);
      router.push('/cart');
    } catch (err) {
      if (err instanceof DifferentCookError) {
        setConfirming(true);
      } else {
        throw err;
      }
    }
  };

  if (confirming) {
    return (
      <div style={{ marginTop: 'auto' }}>
        <p className="cc-muted" style={{ marginBottom: 12, fontSize: 13 }}>
          Your basket already has items from another cook. Replace?
        </p>
        <div className="cc-dish-cta">
          <Btn variant="secondary" full onClick={() => setConfirming(false)}>
            Cancel
          </Btn>
          <Btn variant="primary" full onClick={() => tryAdd(true)}>
            Replace basket
          </Btn>
        </div>
      </div>
    );
  }

  return (
    <div className="cc-dish-cta">
      <div className="cc-qty">
        <button
          type="button"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          aria-label="Decrease"
        >
          <Icon name="minus" size={14} />
        </button>
        <span>{qty}</span>
        <button type="button" onClick={() => setQty((q) => q + 1)} aria-label="Increase">
          <Icon name="plus" size={14} />
        </button>
      </div>
      <Btn variant="primary" size="lg" full onClick={() => tryAdd(false)}>
        Add to cart · <PriceTag cents={props.priceCents * qty} />
      </Btn>
    </div>
  );
}
