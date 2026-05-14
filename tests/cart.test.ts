import { describe, it, expect } from 'vitest';
import {
  emptyCart,
  addToCart,
  removeFromCart,
  setQuantity,
  cartSubtotalCents,
  DifferentCookError,
} from '@/lib/cart';

describe('cart', () => {
  it('adds first item, sets cookId', () => {
    const cart = addToCart(emptyCart(), {
      cookId: 'c1',
      cookName: 'Cook 1',
      dishId: 'd1',
      name: 'Biryani',
      priceCents: 1500,
      qty: 1,
    });
    expect(cart.cookId).toBe('c1');
    expect(cart.cookName).toBe('Cook 1');
    expect(cart.items).toHaveLength(1);
  });

  it('adds second item from same cook, merges qty for duplicate dish', () => {
    let cart = addToCart(emptyCart(), {
      cookId: 'c1',
      dishId: 'd1',
      name: 'Biryani',
      priceCents: 1500,
      qty: 1,
    });
    cart = addToCart(cart, {
      cookId: 'c1',
      dishId: 'd1',
      name: 'Biryani',
      priceCents: 1500,
      qty: 2,
    });
    expect(cart.items[0].qty).toBe(3);
  });

  it('throws when adding from a different cook', () => {
    const cart = addToCart(emptyCart(), {
      cookId: 'c1',
      dishId: 'd1',
      name: 'X',
      priceCents: 100,
      qty: 1,
    });
    expect(() =>
      addToCart(cart, {
        cookId: 'c2',
        dishId: 'd2',
        name: 'Y',
        priceCents: 200,
        qty: 1,
      }),
    ).toThrow(DifferentCookError);
  });

  it('removeFromCart empties when last item removed', () => {
    let cart = addToCart(emptyCart(), {
      cookId: 'c1',
      dishId: 'd1',
      name: 'X',
      priceCents: 100,
      qty: 1,
    });
    cart = removeFromCart(cart, 'd1');
    expect(cart.cookId).toBeNull();
    expect(cart.items).toHaveLength(0);
  });

  it('setQuantity(0) removes the item', () => {
    let cart = addToCart(emptyCart(), {
      cookId: 'c1',
      dishId: 'd1',
      name: 'X',
      priceCents: 100,
      qty: 3,
    });
    cart = setQuantity(cart, 'd1', 0);
    expect(cart.items).toHaveLength(0);
  });

  it('cartSubtotalCents computes correctly', () => {
    let cart = addToCart(emptyCart(), {
      cookId: 'c1',
      dishId: 'd1',
      name: 'A',
      priceCents: 1500,
      qty: 2,
    });
    cart = addToCart(cart, {
      cookId: 'c1',
      dishId: 'd2',
      name: 'B',
      priceCents: 600,
      qty: 1,
    });
    expect(cartSubtotalCents(cart)).toBe(3600); // 1500*2 + 600
  });
});
