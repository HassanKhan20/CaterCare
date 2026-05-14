import type { DishCategory } from '@prisma/client';

// TX SB 541: prohibited items cannot be sold from a residential kitchen
const PROHIBITED_KEYWORDS = [
  'chicken', 'beef', 'pork', 'lamb', 'turkey', 'meat', 'poultry',
  'shrimp', 'fish', 'seafood', 'salmon', 'tuna', 'crab', 'lobster',
  'ice cream', 'gelato', 'sorbet',
  'raw milk',
];

export function isTcsDish(category: DishCategory): boolean {
  return category === 'TCS';
}

export function isProhibitedKeyword(text: string): boolean {
  const lower = text.toLowerCase();
  return PROHIBITED_KEYWORDS.some((kw) => lower.includes(kw));
}

// TX cottage food annual gross cap: $150,000
export type GmvWarningLevel = 'none' | 'soft' | 'hard' | 'admin';

export function gmvWarningLevel(annualGmvCents: number): GmvWarningLevel {
  if (annualGmvCents >= 14_800_000) return 'admin'; // $148K — alert founder
  if (annualGmvCents >= 14_500_000) return 'hard';  // $145K — strong warning to cook
  if (annualGmvCents >= 12_500_000) return 'soft';  // $125K — early heads-up
  return 'none';
}
