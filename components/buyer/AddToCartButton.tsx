'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
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
        qty: 1,
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
      <div className="rounded-2xl bg-[var(--color-surface-1)] border border-amber-500/30 p-4 space-y-3">
        <p className="text-sm text-amber-300">
          Your cart already has items from another cook. Replace cart?
        </p>
        <div className="flex gap-2">
          <Button variant="danger" onClick={() => tryAdd(true)} className="flex-1">
            Replace cart
          </Button>
          <Button variant="secondary" onClick={() => setConfirming(false)} className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button size="lg" className="w-full" onClick={() => tryAdd(false)}>
      Add to cart · ${(props.priceCents / 100).toFixed(2)}
    </Button>
  );
}
