'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { loadCart } from '@/lib/cart';

export function BuyerNavBar() {
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const update = () => {
      const cart = loadCart();
      setCartCount(cart.items.reduce((s, i) => s + i.qty, 0));
    };
    update();
    window.addEventListener('storage', update);
    const t = setInterval(update, 1000);
    return () => {
      window.removeEventListener('storage', update);
      clearInterval(t);
    };
  }, []);

  const active = (prefix: string) =>
    pathname === prefix || pathname.startsWith(prefix + '/')
      ? 'text-brand-400 font-semibold'
      : 'text-[#f5f1ec]/60 hover:text-[#f5f1ec]';

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--color-surface-3)] bg-[var(--color-surface-0)]/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link
          href="/browse"
          className="text-xl font-bold tracking-tight hover:text-brand-400 transition-colors"
        >
          CaterCare
        </Link>

        <div className="flex items-center gap-6">
          <Link href="/browse" className={`text-sm transition-colors ${active('/browse')}`}>
            Browse
          </Link>
          <Link href="/orders" className={`text-sm transition-colors ${active('/orders')}`}>
            Orders
          </Link>
          <Link href="/account" className={`text-sm transition-colors ${active('/account')}`}>
            Account
          </Link>
          <Link href="/cart" className={`relative text-sm transition-colors ${active('/cart')}`}>
            Cart
            {cartCount > 0 && (
              <span className="absolute -top-2.5 -right-3.5 min-w-[1.1rem] h-[1.1rem] px-0.5 flex items-center justify-center bg-brand-400 text-[#1a1715] text-[10px] font-bold rounded-full">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
}
