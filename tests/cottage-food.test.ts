import { describe, it, expect } from 'vitest';
import { isTcsDish, isProhibitedKeyword, gmvWarningLevel } from '@/lib/cottage-food';

describe('cottage-food helpers', () => {
  it('TCS dish detected', () => expect(isTcsDish('TCS')).toBe(true));
  it('NON_TCS dish not TCS', () => expect(isTcsDish('NON_TCS')).toBe(false));
  it('prohibited keyword: chicken', () =>
    expect(isProhibitedKeyword('chicken biryani')).toBe(true));
  it('non-prohibited: biryani rice', () =>
    expect(isProhibitedKeyword('biryani rice')).toBe(false));
  it('case-insensitive: BEEF', () =>
    expect(isProhibitedKeyword('BEEF curry')).toBe(true));
  it('gmv warning: no warning below $125K', () =>
    expect(gmvWarningLevel(12_400_000)).toBe('none'));
  it('gmv warning: soft warn at $125K', () =>
    expect(gmvWarningLevel(12_500_000)).toBe('soft'));
  it('gmv warning: hard warn at $145K', () =>
    expect(gmvWarningLevel(14_500_000)).toBe('hard'));
  it('gmv warning: admin alert at $148K', () =>
    expect(gmvWarningLevel(14_800_000)).toBe('admin'));
  it('gmv warning: admin alert above cap', () =>
    expect(gmvWarningLevel(20_000_000)).toBe('admin'));
});
