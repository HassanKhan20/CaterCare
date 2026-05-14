'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  loadCart,
  saveCart,
  setQuantity,
  removeFromCart,
  cartSubtotalCents,
  emptyCart,
  type Cart,
} from '@/lib/cart';

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart>(emptyCart());

  useEffect(() => {
    setCart(loadCart());
  }, []);

  const update = (next: Cart) => {
    setCart(next);
    saveCart(next);
  };

  if (cart.items.length === 0) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md text-center">
          <h1 className="text-xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-slate-600 mb-4">Find a local cook to get started.</p>
          <Link href="/browse">
            <Button>Browse cooks</Button>
          </Link>
        </Card>
      </main>
    );
  }

  const subtotal = cartSubtotalCents(cart);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/browse" className="text-sm text-slate-600 hover:text-slate-900">
            ← Keep browsing
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-3xl font-bold">Your cart</h1>
        <p className="text-slate-600">From {cart.cookName}</p>

        <div className="space-y-3">
          {cart.items.map((item) => (
            <Card key={item.dishId} className="flex items-center gap-4">
              {item.photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.photoUrl}
                  alt={item.name}
                  className="w-16 h-16 rounded-md object-cover"
                />
              )}
              <div className="flex-1">
                <h3 className="font-medium">{item.name}</h3>
                <p className="text-sm text-slate-600">
                  ${(item.priceCents / 100).toFixed(2)} each
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => update(setQuantity(cart, item.dishId, item.qty - 1))}
                  aria-label="decrease"
                >
                  −
                </Button>
                <span className="w-6 text-center">{item.qty}</span>
                <Button
                  variant="ghost"
                  onClick={() => update(setQuantity(cart, item.dishId, item.qty + 1))}
                  aria-label="increase"
                >
                  +
                </Button>
              </div>
              <Button
                variant="ghost"
                onClick={() => update(removeFromCart(cart, item.dishId))}
                className="text-red-600"
              >
                Remove
              </Button>
            </Card>
          ))}
        </div>

        <Card>
          <div className="flex justify-between text-lg font-medium">
            <span>Subtotal</span>
            <span>${(subtotal / 100).toFixed(2)}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Service fee, delivery, and tip calculated at checkout.
          </p>
          <Button className="w-full mt-4" onClick={() => router.push('/checkout')}>
            Proceed to checkout
          </Button>
        </Card>
      </div>
    </main>
  );
}
