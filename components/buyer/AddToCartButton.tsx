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
      <div className="space-y-2">
        <p className="text-sm text-amber-700">
          Your cart already has items from another cook. Replace cart?
        </p>
        <div className="flex gap-2">
          <Button variant="danger" onClick={() => tryAdd(true)}>
            Replace cart
          </Button>
          <Button variant="secondary" onClick={() => setConfirming(false)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return <Button onClick={() => tryAdd(false)}>Add to cart</Button>;
}
