import { describe, it, expect } from 'vitest';
import { haversineMiles, isWithinRadius } from '@/lib/geo';

describe('haversineMiles', () => {
  it('Plano to Uptown Dallas is 15-22 miles', () => {
    const d = haversineMiles(
      { lat: 33.0738, lng: -96.7480 },
      { lat: 32.7986, lng: -96.8009 },
    );
    expect(d).toBeGreaterThan(15);
    expect(d).toBeLessThan(22);
  });
  it('same point is 0 miles', () => {
    expect(haversineMiles({ lat: 32.7, lng: -96.8 }, { lat: 32.7, lng: -96.8 })).toBeCloseTo(0);
  });
  it('isWithinRadius respects radius', () => {
    expect(
      isWithinRadius({ lat: 32.7, lng: -96.8 }, { lat: 32.701, lng: -96.801 }, 1),
    ).toBe(true);
    expect(
      isWithinRadius({ lat: 32.7, lng: -96.8 }, { lat: 33.5, lng: -97.0 }, 1),
    ).toBe(false);
  });
});
