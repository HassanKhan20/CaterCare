import type { OrderState as PrismaOrderState, UserRole } from '@prisma/client';

export type OrderState = PrismaOrderState;

type Rule = { from: OrderState; to: OrderState; roles: UserRole[] };

const rules: Rule[] = [
  { from: 'DRAFT', to: 'PLACED', roles: ['BUYER'] },
  { from: 'PLACED', to: 'COOK_ACCEPTED', roles: ['COOK'] },
  { from: 'PLACED', to: 'COOK_DECLINED', roles: ['COOK'] },
  { from: 'COOK_ACCEPTED', to: 'PREPARING', roles: ['COOK'] },
  { from: 'PREPARING', to: 'READY_FOR_PICKUP', roles: ['COOK'] },
  { from: 'READY_FOR_PICKUP', to: 'DRIVER_ASSIGNED', roles: ['DRIVER', 'ADMIN'] },
  { from: 'DRIVER_ASSIGNED', to: 'PICKED_UP', roles: ['DRIVER'] },
  { from: 'PICKED_UP', to: 'DELIVERED', roles: ['DRIVER'] },
  { from: 'DELIVERED', to: 'COMPLETED', roles: ['ADMIN'] }, // also via cron
];

const adminAlways: OrderState[] = ['CANCELLED', 'REFUNDED'];

export function canTransition(from: OrderState, to: OrderState, role: UserRole): boolean {
  if (role === 'ADMIN' && adminAlways.includes(to)) return true;
  return rules.some((r) => r.from === from && r.to === to && r.roles.includes(role));
}

export function allowedTransitions(from: OrderState, role?: UserRole): OrderState[] {
  return rules
    .filter((r) => r.from === from && (!role || r.roles.includes(role)))
    .map((r) => r.to);
}

export const TERMINAL_STATES: OrderState[] = [
  'COMPLETED',
  'CANCELLED',
  'REFUNDED',
  'COOK_DECLINED',
];
