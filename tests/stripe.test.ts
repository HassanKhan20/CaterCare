import { describe, it, expect } from 'vitest';
import { computeFinancials } from '@/lib/stripe';

describe('computeFinancials', () => {
  it('calculates a typical $20 order, 3mi delivery, $3 tip', () => {
    const f = computeFinancials({
      subtotalCents: 2000,
      distanceMiles: 3,
      tipCents: 300,
      commissionPct: 11,
      serviceFeePct: 9,
      driverBaseCents: 400,
      driverPerMileCents: 125,
    });
    expect(f.cookCommissionCents).toBe(220);          // 11% of 2000
    expect(f.buyerServiceFeeCents).toBe(180);         // 9% of 2000
    expect(f.driverBasePayCents).toBe(775);           // 400 + 3*125
    expect(f.deliveryFeeCents).toBe(975);             // 775 + 200 spread
    expect(f.driverTipCents).toBe(300);
  });
  it('rounds commission cents correctly', () => {
    const f = computeFinancials({
      subtotalCents: 1733,
      distanceMiles: 0.7,
      tipCents: 0,
      commissionPct: 11,
      serviceFeePct: 9,
      driverBaseCents: 400,
      driverPerMileCents: 125,
    });
    expect(f.cookCommissionCents).toBe(191);
  });
  it('zero tip works', () => {
    const f = computeFinancials({
      subtotalCents: 1000,
      distanceMiles: 2,
      tipCents: 0,
      commissionPct: 10,
      serviceFeePct: 8,
      driverBaseCents: 400,
      driverPerMileCents: 100,
    });
    expect(f.driverTipCents).toBe(0);
  });
});
