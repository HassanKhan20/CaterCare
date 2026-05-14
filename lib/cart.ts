export type CartItem = {
  dishId: string;
  cookId: string;
  name: string;
  priceCents: number;
  qty: number;
  photoUrl?: string | null;
};

export type Cart = {
  cookId: string | null;
  cookName: string | null;
  items: CartItem[];
};

const STORAGE_KEY = 'catercare:cart';

export function emptyCart(): Cart {
  return { cookId: null, cookName: null, items: [] };
}

export function loadCart(): Cart {
  if (typeof window === 'undefined') return emptyCart();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyCart();
    return JSON.parse(raw) as Cart;
  } catch {
    return emptyCart();
  }
}

export function saveCart(cart: Cart): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
}

export class DifferentCookError extends Error {
  constructor() {
    super('DIFFERENT_COOK');
    this.name = 'DifferentCookError';
  }
}

export function addToCart(
  cart: Cart,
  item: CartItem & { cookName?: string },
): Cart {
  if (cart.cookId && cart.cookId !== item.cookId) {
    throw new DifferentCookError();
  }
  const existing = cart.items.find((i) => i.dishId === item.dishId);
  const items = existing
    ? cart.items.map((i) =>
        i.dishId === item.dishId ? { ...i, qty: i.qty + item.qty } : i,
      )
    : [...cart.items, item];
  return {
    cookId: item.cookId,
    cookName: cart.cookName ?? item.cookName ?? null,
    items,
  };
}

export function removeFromCart(cart: Cart, dishId: string): Cart {
  const items = cart.items.filter((i) => i.dishId !== dishId);
  return items.length === 0 ? emptyCart() : { ...cart, items };
}

export function setQuantity(cart: Cart, dishId: string, qty: number): Cart {
  if (qty <= 0) return removeFromCart(cart, dishId);
  return {
    ...cart,
    items: cart.items.map((i) => (i.dishId === dishId ? { ...i, qty } : i)),
  };
}

export function cartSubtotalCents(cart: Cart): number {
  return cart.items.reduce((sum, i) => sum + i.priceCents * i.qty, 0);
}
