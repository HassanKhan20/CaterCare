import { describe, it, expect } from 'vitest';
import { canTransition, allowedTransitions, TERMINAL_STATES } from '@/lib/order-state';

describe('order state machine', () => {
  it('PLACED → COOK_ACCEPTED is allowed for cook', () => {
    expect(canTransition('PLACED', 'COOK_ACCEPTED', 'COOK')).toBe(true);
  });
  it('PLACED → DELIVERED is not allowed', () => {
    expect(canTransition('PLACED', 'DELIVERED', 'COOK')).toBe(false);
  });
  it('COOK_ACCEPTED → PICKED_UP is not allowed for buyer', () => {
    expect(canTransition('COOK_ACCEPTED', 'PICKED_UP', 'BUYER')).toBe(false);
  });
  it('PICKED_UP → DELIVERED is allowed for driver', () => {
    expect(canTransition('PICKED_UP', 'DELIVERED', 'DRIVER')).toBe(true);
  });
  it('any state → CANCELLED is allowed for admin', () => {
    expect(canTransition('PREPARING', 'CANCELLED', 'ADMIN')).toBe(true);
  });
  it('admin can REFUND a DELIVERED order', () => {
    expect(canTransition('DELIVERED', 'REFUNDED', 'ADMIN')).toBe(true);
  });
  it('terminal COMPLETED has no transitions', () => {
    expect(allowedTransitions('COMPLETED')).toEqual([]);
  });
  it('TERMINAL_STATES includes COMPLETED, CANCELLED, REFUNDED, COOK_DECLINED', () => {
    expect(TERMINAL_STATES).toEqual(
      expect.arrayContaining(['COMPLETED', 'CANCELLED', 'REFUNDED', 'COOK_DECLINED']),
    );
  });
});
