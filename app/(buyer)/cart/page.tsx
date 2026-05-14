'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
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
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <EmptyState
          icon="🛒"
          title="Your cart is empty"
          description="Find a local cook to get started."
          action={
            <Link href="/browse">
              <Button>Browse cooks</Button>
            </Link>
          }
        />
      </main>
    );
  }

  const subtotal = cartSubtotalCents(cart);

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Contextual back nav */}
      <div className="border-b bg-white">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <Link href="/browse" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
            ← Keep browsing
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Your cart</h1>
          <p className="text-slate-500 text-sm mt-1">From {cart.cookName}</p>
        </div>

        <div className="space-y-3">
          {cart.items.map((item) => (
            <Card key={item.dishId} className="flex items-center gap-4 py-4 px-5">
              {item.photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.photoUrl}
                  alt={item.name}
                  className="w-16 h-16 rounded-lg object-cover shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 truncate">{item.name}</p>
                <p className="text-sm text-slate-500">${(item.priceCents / 100).toFixed(2)} each</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  className="w-8 h-8 rounded-full border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold transition-colors flex items-center justify-center"
                  onClick={() => update(setQuantity(cart, item.dishId, item.qty - 1))}
                  aria-label="decrease"
                >
                  −
                </button>
                <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
                <button
                  className="w-8 h-8 rounded-full border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold transition-colors flex items-center justify-center"
                  onClick={() => update(setQuantity(cart, item.dishId, item.qty + 1))}
                  aria-label="increase"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => update(removeFromCart(cart, item.dishId))}
                className="text-xs text-red-400 hover:text-red-600 transition-colors ml-1"
              >
                Remove
              </button>
            </Card>
          ))}
        </div>

        <Card>
          <div className="flex justify-between text-lg font-semibold text-slate-900">
            <span>Subtotal</span>
            <span>${(subtotal / 100).toFixed(2)}</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Service fee, delivery, and tip added at checkout.
          </p>
          <Button className="w-full mt-4" onClick={() => router.push('/checkout')}>
            Proceed to checkout
          </Button>
        </Card>
      </div>
    </main>
  );
}
