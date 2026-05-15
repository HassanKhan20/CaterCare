'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { loadCart } from '@/lib/cart';

export function BuyerNavBar({ location = 'Plano, TX' }: { location?: string }) {
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

  const isOn = (prefix: string) =>
    pathname === prefix || pathname.startsWith(prefix + '/');

  return (
    <header className="cc-nav">
      <div className="cc-nav-inner">
        <Link href="/browse" className="cc-logo">
          <span className="cc-logo-mark">
            <svg viewBox="0 0 32 32" width="22" height="22">
              <circle
                cx="16"
                cy="16"
                r="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
              />
              <path
                d="M9 16c2-3 5-3 7 0s5 3 7 0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span className="cc-logo-text">catercare</span>
        </Link>

        <button type="button" className="cc-loc" aria-label="Change delivery location">
          <Icon name="pin" size={15} />
          <span className="cc-loc-label">Deliver to</span>
          <span className="cc-loc-place">{location}</span>
          <span className="cc-loc-caret">▾</span>
        </button>

        <div className="cc-nav-spacer" />

        <nav className="cc-nav-links">
          <Link href="/browse" className={isOn('/browse') ? 'is-on' : undefined}>
            Browse
          </Link>
          <Link href="/orders" className={isOn('/orders') ? 'is-on' : undefined}>
            Orders
          </Link>
          <Link href="/account" className={isOn('/account') ? 'is-on' : undefined}>
            Account
          </Link>
        </nav>

        <Link href="/cart" className="cc-bag-btn" aria-label="Cart">
          <Icon name="bag" size={18} />
          {cartCount > 0 && <span className="cc-bag-count">{cartCount}</span>}
        </Link>
      </div>
    </header>
  );
}
