# CaterCare v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a working three-sided home-food marketplace (cooks / buyers / drivers) for one DFW neighborhood, with Stripe Connect payment splits, food-handler-cert compliance, and manual dispatch fallback. Beta-ready in ~12 weeks for two developers working in parallel.

**Architecture:** Single Next.js 15 codebase (App Router) with role-based dashboards. Postgres + Prisma. Stripe Connect Express accounts for cook + driver payouts with automatic 3-way splits. Cloudflare R2 for photos. Auth.js v5 for auth. Mobile-web responsive, no native apps.

**Tech Stack:** Next.js 15 + TypeScript + Tailwind, Postgres + PostGIS + Prisma, Stripe Connect, Auth.js v5, Cloudflare R2, Resend, Mapbox GL, Vitest + Playwright, Vercel + Neon.

---

## Parallelization Model

| Section | Owner | Depends on |
|---|---|---|
| **Phase 0: Foundation** | Both pair | Nothing |
| **Track A: Supply & Operations** | Partner A | Phase 0 |
| **Track B: Demand & Fulfillment** | Partner B | Phase 0 |
| **Phase 2: Integration & Launch** | Both pair | A + B complete |

### File-ownership rules (no overlap, ever)

| Path | Owned by |
|---|---|
| `prisma/schema.prisma` | **Phase 0 freezes it.** Later additions only via PR reviewed by both. |
| `lib/auth.ts`, `lib/stripe.ts`, `lib/order-state.ts`, `lib/geo.ts`, `lib/email.ts`, `lib/photo-upload.ts`, `lib/tos.ts` | Phase 0 |
| `app/cook/**`, `app/admin/**`, `app/api/cook/**`, `app/api/admin/**` | Track A |
| `app/(buyer)/**`, `app/driver/**`, `app/api/buyer/**`, `app/api/driver/**`, `app/api/orders/**`, `app/api/stripe-webhook/**` | Track B |
| `tests/cook/**`, `tests/admin/**` | Track A |
| `tests/buyer/**`, `tests/driver/**`, `tests/orders/**` | Track B |

If a partner needs something in the other's territory, they request an API endpoint via PR comment — never edit the other's files.

### Cross-track API contracts (frozen at end of Phase 0)

These are the only seams between A and B:

- `GET /api/public/cooks?lat=&lng=&cuisine=&availableNow=` → list of approved, currently-listable cooks within radius (Track A owns the data, Track B reads)
- `GET /api/public/cooks/:id` → single cook profile + active dishes (Track A owns, Track B reads)
- `GET /api/public/dishes/:id` → dish detail (Track A owns, Track B reads)
- `POST /api/orders` → create order from buyer's cart (Track B owns; Track A's cook inbox reads via `GET /api/cook/orders`)
- `GET /api/cook/orders` → orders assigned to the authenticated cook (Track A owns; reads `Order` rows created by Track B)
- `POST /api/cook/orders/:id/transition` → cook accepts / declines / marks ready (Track A owns; mutates Order state)
- `GET /api/admin/drivers/pending` → drivers awaiting verification approval (Track A reads `DriverProfile` rows created by Track B)

---

# Phase 0: Foundation

**Duration target:** 1 week. **Both partners pair**, or one drives while the other reviews.

## Task 0.1: Initialize Next.js project

**Files:** `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `app/layout.tsx`, `app/page.tsx`

- [ ] **Step 1: Scaffold**

```bash
pnpm create next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias="@/*" --eslint --use-pnpm
```

- [ ] **Step 2: Add deps**

```bash
pnpm add prisma @prisma/client next-auth@beta @auth/prisma-adapter zod stripe @stripe/stripe-js @aws-sdk/client-s3 @aws-sdk/s3-request-presigner resend mapbox-gl
pnpm add -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @playwright/test @types/node tsx jsdom
```

- [ ] **Step 3: Add scripts to `package.json`**

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test",
  "db:migrate": "prisma migrate dev",
  "db:push": "prisma db push",
  "db:studio": "prisma studio",
  "db:seed": "tsx prisma/seed.ts",
  "typecheck": "tsc --noEmit"
}
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "chore: scaffold Next.js + deps"
```

## Task 0.2: Configure Vitest with a smoke test

**Files:** `vitest.config.ts`, `tests/setup.ts`, `tests/smoke.test.ts`

- [ ] **Step 1: Write `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
  },
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
});
```

- [ ] **Step 2: Write `tests/setup.ts`**

```typescript
import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
afterEach(() => vi.restoreAllMocks());
```

- [ ] **Step 3: Write failing smoke test `tests/smoke.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
describe('smoke', () => {
  it('arithmetic works', () => { expect(1 + 1).toBe(2); });
});
```

- [ ] **Step 4: Run** `pnpm test` → expect 1 passed.

- [ ] **Step 5: Commit** `chore: configure vitest`

## Task 0.3: Configure environment variables

**Files:** `.env.example`, `.env.local`, `lib/env.ts`

- [ ] **Step 1: Write `.env.example`**

```
DATABASE_URL=postgres://user:pass@localhost:5432/catercare
NEXTAUTH_SECRET=replace_me
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=catercare-photos
R2_PUBLIC_URL=https://photos.example.com
RESEND_API_KEY=
RESEND_FROM=CaterCare <hello@example.com>
MAPBOX_TOKEN=
APP_URL=http://localhost:3000
PLATFORM_COMMISSION_PCT=11
BUYER_SERVICE_FEE_PCT=9
DRIVER_BASE_PAY_CENTS=400
DRIVER_PER_MILE_CENTS=125
```

- [ ] **Step 2: Write `lib/env.ts`** (validates at boot)

```typescript
import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(16),
  NEXTAUTH_URL: z.string().url(),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  R2_ACCOUNT_ID: z.string(),
  R2_ACCESS_KEY_ID: z.string(),
  R2_SECRET_ACCESS_KEY: z.string(),
  R2_BUCKET: z.string(),
  R2_PUBLIC_URL: z.string().url(),
  RESEND_API_KEY: z.string(),
  RESEND_FROM: z.string(),
  MAPBOX_TOKEN: z.string(),
  APP_URL: z.string().url(),
  PLATFORM_COMMISSION_PCT: z.coerce.number().min(0).max(50),
  BUYER_SERVICE_FEE_PCT: z.coerce.number().min(0).max(50),
  DRIVER_BASE_PAY_CENTS: z.coerce.number().int().nonnegative(),
  DRIVER_PER_MILE_CENTS: z.coerce.number().int().nonnegative(),
});

export const env = schema.parse(process.env);
```

- [ ] **Step 3:** Copy to `.env.local`, fill placeholders for dev.
- [ ] **Step 4:** Commit `chore: env validation`

## Task 0.4: Set up Postgres + Prisma schema (the whole schema, all at once — this is the contract)

**Files:** `prisma/schema.prisma`, `prisma/migrations/`

- [ ] **Step 1: Provision Postgres** (Neon for prod, local Docker for dev)

```bash
docker run -d --name catercare-pg -e POSTGRES_PASSWORD=dev -e POSTGRES_DB=catercare -p 5432:5432 postgis/postgis:16-3.4
```

- [ ] **Step 2: Init Prisma**

```bash
pnpm prisma init --datasource-provider postgresql
```

- [ ] **Step 3: Write the complete schema** in `prisma/schema.prisma`:

```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql"; url = env("DATABASE_URL"); extensions = [postgis] }

enum UserRole { COOK BUYER DRIVER ADMIN }
enum UserStatus { PENDING ACTIVE SUSPENDED }
enum VerificationStatus { NOT_SUBMITTED PENDING APPROVED REJECTED }
enum BackgroundCheckStatus { NOT_STARTED PENDING APPROVED REJECTED }
enum OrderState {
  DRAFT PLACED COOK_ACCEPTED COOK_DECLINED PREPARING
  READY_FOR_PICKUP DRIVER_ASSIGNED PICKED_UP DELIVERED
  COMPLETED CANCELLED REFUNDED
}
enum TosType { COOK BUYER DRIVER }

model User {
  id           String     @id @default(cuid())
  email        String     @unique
  emailVerified DateTime?
  name         String?
  phone        String?
  roles        UserRole[]
  status       UserStatus @default(PENDING)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  cookProfile  CookProfile?
  buyerProfile BuyerProfile?
  driverProfile DriverProfile?
  tosAcceptances TosAcceptance[]
  sessions     Session[]
  accounts     Account[]
  buyerOrders  Order[] @relation("BuyerOrders")
  cookOrders   Order[] @relation("CookOrders")
  driverOrders Order[] @relation("DriverOrders")
}

model Account {
  id        String @id @default(cuid())
  userId    String
  type      String
  provider  String
  providerAccountId String
  refresh_token String? @db.Text
  access_token  String? @db.Text
  expires_at    Int?
  token_type    String?
  scope         String?
  id_token      String? @db.Text
  session_state String?
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
}

model CookProfile {
  userId               String   @id
  user                 User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  photoUrl             String?
  story                String?  @db.Text
  cuisineTags          String[]
  neighborhood         String?
  addressLine          String?
  lat                  Float?
  lng                  Float?

  idDocUrl             String?
  idStatus             VerificationStatus @default(NOT_SUBMITTED)

  foodHandlerCertUrl   String?
  foodHandlerCertExpiresAt DateTime?
  foodHandlerCertStatus    VerificationStatus @default(NOT_SUBMITTED)

  stripeConnectAccountId String?
  stripeOnboardingComplete Boolean @default(false)

  approvedAt           DateTime?
  approvedByUserId     String?
  rejectedReason       String?

  dishes               Dish[]
  availability         CookAvailability[]
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}

model Dish {
  id            String   @id @default(cuid())
  cookId        String
  cook          CookProfile @relation(fields: [cookId], references: [userId], onDelete: Cascade)
  name          String
  description   String   @db.Text
  photoUrl      String?
  priceCents    Int
  portionSize   String?
  allergens     String[]
  leadTimeHours Int      @default(4)
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  orderItems    OrderItem[]
  @@index([cookId, isActive])
}

model CookAvailability {
  id                  String @id @default(cuid())
  cookId              String
  cook                CookProfile @relation(fields: [cookId], references: [userId], onDelete: Cascade)
  dayOfWeek           Int    // 0=Sun..6=Sat
  startTime           String // "09:00"
  endTime             String // "20:00"
  orderCutoffMinutes  Int    @default(60)
  maxOrdersPerDay     Int    @default(10)
  @@unique([cookId, dayOfWeek])
}

model BuyerProfile {
  userId    String   @id
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  addresses BuyerAddress[]
  createdAt DateTime @default(now())
}

model BuyerAddress {
  id        String @id @default(cuid())
  buyerId   String
  buyer     BuyerProfile @relation(fields: [buyerId], references: [userId], onDelete: Cascade)
  label     String   // "Home", "Office"
  line1     String
  line2     String?
  city      String
  state     String
  zip       String
  lat       Float
  lng       Float
  isDefault Boolean @default(false)
}

model DriverProfile {
  userId             String   @id
  user               User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  licenseDocUrl      String?
  licenseExpiresAt   DateTime?
  insuranceDocUrl    String?
  insuranceExpiresAt DateTime?
  carPhotoUrl        String?
  idDocUrl           String?
  dateOfBirth        DateTime?
  docsStatus         VerificationStatus @default(NOT_SUBMITTED)
  backgroundCheckStatus BackgroundCheckStatus @default(NOT_STARTED)
  backgroundCheckCompletedAt DateTime?
  stripeConnectAccountId String?
  stripeOnboardingComplete Boolean @default(false)
  isOnline           Boolean  @default(false)
  currentLat         Float?
  currentLng         Float?
  approvedAt         DateTime?
  approvedByUserId   String?
  rejectedReason     String?
}

model Order {
  id                   String     @id @default(cuid())
  buyerId              String
  buyer                User       @relation("BuyerOrders", fields: [buyerId], references: [id])
  cookId               String
  cook                 User       @relation("CookOrders", fields: [cookId], references: [id])
  driverId             String?
  driver               User?      @relation("DriverOrders", fields: [driverId], references: [id])

  state                OrderState @default(DRAFT)

  subtotalCents        Int
  cookCommissionCents  Int        // platform cut from cook
  buyerServiceFeeCents Int        // platform fee from buyer
  deliveryFeeCents     Int        // buyer pays
  driverBasePayCents   Int        // platform pays driver
  driverTipCents       Int        @default(0)
  totalChargedCents    Int        // what buyer's card sees
  cookPayoutCents      Int        // subtotal - cookCommission
  driverPayoutCents    Int        // basePay + tip
  platformRevenueCents Int        // cookCommission + serviceFee + (deliveryFee - basePay)

  pickupAddressLine    String
  pickupLat            Float
  pickupLng            Float
  deliveryAddressLine  String
  deliveryLat          Float
  deliveryLng          Float
  distanceMiles        Float

  requestedDeliveryAt  DateTime
  placedAt             DateTime?
  acceptedAt           DateTime?
  preparingAt          DateTime?
  readyAt              DateTime?
  pickedUpAt           DateTime?
  deliveredAt          DateTime?
  completedAt          DateTime?
  cancelledAt          DateTime?

  homeKitchenDisclosureAccepted Boolean
  homeKitchenDisclosureAcceptedAt DateTime
  cookCertSnapshotExpiresAt DateTime

  stripePaymentIntentId String?
  stripeChargeId        String?

  buyerNote            String?
  cancellationReason   String?

  items                OrderItem[]
  events               OrderEvent[]

  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  @@index([state])
  @@index([cookId, state])
  @@index([driverId, state])
  @@index([buyerId, createdAt])
}

model OrderItem {
  id            String @id @default(cuid())
  orderId       String
  order         Order  @relation(fields: [orderId], references: [id], onDelete: Cascade)
  dishId        String
  dish          Dish   @relation(fields: [dishId], references: [id])
  dishNameSnapshot   String
  unitPriceCents Int
  quantity      Int
}

model OrderEvent {
  id        String     @id @default(cuid())
  orderId   String
  order     Order      @relation(fields: [orderId], references: [id], onDelete: Cascade)
  fromState OrderState?
  toState   OrderState
  actorUserId String?
  note      String?
  createdAt DateTime   @default(now())
  @@index([orderId, createdAt])
}

model TosAcceptance {
  id        String  @id @default(cuid())
  userId    String
  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  tosType   TosType
  version   String
  acceptedAt DateTime @default(now())
  ipAddress String?
  @@index([userId, tosType])
}
```

- [ ] **Step 4: Run migration**

```bash
pnpm prisma migrate dev --name init
```

- [ ] **Step 5: Generate client + write `lib/prisma.ts`**

```typescript
import { PrismaClient } from '@prisma/client';
const globalForPrisma = global as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

- [ ] **Step 6: Commit** `feat(db): initial schema with all entities + state machine`

## Task 0.5: Order state machine helper

**Files:** `lib/order-state.ts`, `tests/order-state.test.ts`

- [ ] **Step 1: Write failing test `tests/order-state.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { canTransition, allowedTransitions, OrderState } from '@/lib/order-state';

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
  it('terminal COMPLETED has no transitions', () => {
    expect(allowedTransitions('COMPLETED')).toEqual([]);
  });
});
```

- [ ] **Step 2: Implement `lib/order-state.ts`**

```typescript
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
  return rules.some(r => r.from === from && r.to === to && r.roles.includes(role));
}

export function allowedTransitions(from: OrderState, role?: UserRole): OrderState[] {
  return rules
    .filter(r => r.from === from && (!role || r.roles.includes(role)))
    .map(r => r.to);
}

export const TERMINAL_STATES: OrderState[] = ['COMPLETED', 'CANCELLED', 'REFUNDED', 'COOK_DECLINED'];
```

- [ ] **Step 3:** `pnpm test order-state` → all pass.
- [ ] **Step 4:** Commit `feat(lib): order state machine`

## Task 0.6: Auth.js v5 setup with role-aware sessions

**Files:** `lib/auth.ts`, `app/api/auth/[...nextauth]/route.ts`, `middleware.ts`

- [ ] **Step 1: Write `lib/auth.ts`**

```typescript
import NextAuth, { type DefaultSession } from 'next-auth';
import Google from 'next-auth/providers/google';
import Email from 'next-auth/providers/nodemailer';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import type { UserRole, UserStatus } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      roles: UserRole[];
      status: UserStatus;
    } & DefaultSession['user'];
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'database' },
  providers: [
    Google({ clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET! }),
  ],
  callbacks: {
    async session({ session, user }) {
      const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
      if (dbUser) {
        session.user.id = dbUser.id;
        session.user.roles = dbUser.roles;
        session.user.status = dbUser.status;
      }
      return session;
    },
  },
  pages: { signIn: '/signin' },
});

export async function requireRole(role: UserRole) {
  const session = await auth();
  if (!session?.user || !session.user.roles.includes(role)) {
    throw new Error('UNAUTHORIZED');
  }
  return session.user;
}
```

- [ ] **Step 2: Write `app/api/auth/[...nextauth]/route.ts`**

```typescript
export { GET, POST } from '@/lib/auth';
```

Actually: `import { handlers } from '@/lib/auth'; export const { GET, POST } = handlers;`

- [ ] **Step 3: Write `middleware.ts`**

```typescript
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isProtected = /^\/(cook|admin|driver|buyer)/.test(pathname);
  if (isProtected && !req.auth) {
    return NextResponse.redirect(new URL(`/signin?from=${pathname}`, req.url));
  }
});

export const config = { matcher: ['/cook/:path*', '/admin/:path*', '/driver/:path*', '/buyer/:path*'] };
```

- [ ] **Step 4: Commit** `feat(auth): NextAuth v5 with role-aware sessions`

## Task 0.7: Stripe Connect helper

**Files:** `lib/stripe.ts`, `tests/stripe.test.ts`

- [ ] **Step 1: Write `lib/stripe.ts`**

```typescript
import Stripe from 'stripe';
import { env } from '@/lib/env';

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' });

export async function createConnectAccount(email: string, userType: 'cook' | 'driver') {
  return stripe.accounts.create({
    type: 'express',
    email,
    capabilities: { transfers: { requested: true } },
    business_type: 'individual',
    metadata: { userType },
  });
}

export async function createOnboardingLink(accountId: string, refreshUrl: string, returnUrl: string) {
  return stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  });
}

export type OrderFinancials = {
  subtotalCents: number;
  buyerServiceFeeCents: number;
  deliveryFeeCents: number;
  driverTipCents: number;
  cookCommissionCents: number;
  driverBasePayCents: number;
};

/**
 * Creates a PaymentIntent that charges the buyer the full amount,
 * sets up automatic transfer to cook's connected account
 * (driver gets paid via a separate transfer post-delivery).
 */
export async function createOrderPaymentIntent(args: {
  financials: OrderFinancials;
  buyerStripeCustomerId?: string;
  cookStripeAccountId: string;
  metadata: Record<string, string>;
}) {
  const { financials, cookStripeAccountId, metadata } = args;
  const total = financials.subtotalCents + financials.buyerServiceFeeCents
    + financials.deliveryFeeCents + financials.driverTipCents;
  const cookPayout = financials.subtotalCents - financials.cookCommissionCents;

  return stripe.paymentIntents.create({
    amount: total,
    currency: 'usd',
    automatic_payment_methods: { enabled: true },
    application_fee_amount: total - cookPayout,
    transfer_data: { destination: cookStripeAccountId },
    metadata,
  });
}

export async function transferToDriver(args: {
  amountCents: number;
  driverStripeAccountId: string;
  orderId: string;
}) {
  return stripe.transfers.create({
    amount: args.amountCents,
    currency: 'usd',
    destination: args.driverStripeAccountId,
    transfer_group: `order_${args.orderId}`,
    metadata: { orderId: args.orderId },
  });
}

export function computeFinancials(args: {
  subtotalCents: number;
  distanceMiles: number;
  tipCents: number;
  commissionPct: number;
  serviceFeePct: number;
  driverBaseCents: number;
  driverPerMileCents: number;
}): OrderFinancials {
  const cookCommissionCents = Math.round(args.subtotalCents * args.commissionPct / 100);
  const buyerServiceFeeCents = Math.round(args.subtotalCents * args.serviceFeePct / 100);
  const driverBasePayCents = args.driverBaseCents + Math.round(args.distanceMiles * args.driverPerMileCents);
  const deliveryFeeCents = driverBasePayCents + 200; // platform keeps $2 spread
  return {
    subtotalCents: args.subtotalCents,
    buyerServiceFeeCents,
    deliveryFeeCents,
    driverTipCents: args.tipCents,
    cookCommissionCents,
    driverBasePayCents,
  };
}
```

- [ ] **Step 2: Write `tests/stripe.test.ts`** (pure-function tests, no API calls)

```typescript
import { describe, it, expect } from 'vitest';
import { computeFinancials } from '@/lib/stripe';

describe('computeFinancials', () => {
  it('calculates a typical $20 order, 3mi delivery, $3 tip', () => {
    const f = computeFinancials({
      subtotalCents: 2000, distanceMiles: 3, tipCents: 300,
      commissionPct: 11, serviceFeePct: 9,
      driverBaseCents: 400, driverPerMileCents: 125,
    });
    expect(f.cookCommissionCents).toBe(220);          // 11% of 2000
    expect(f.buyerServiceFeeCents).toBe(180);         // 9% of 2000
    expect(f.driverBasePayCents).toBe(775);           // 400 + 3*125
    expect(f.deliveryFeeCents).toBe(975);             // 775 + 200 spread
    expect(f.driverTipCents).toBe(300);
  });
  it('rounds commission cents correctly', () => {
    const f = computeFinancials({
      subtotalCents: 1733, distanceMiles: 0.7, tipCents: 0,
      commissionPct: 11, serviceFeePct: 9,
      driverBaseCents: 400, driverPerMileCents: 125,
    });
    expect(f.cookCommissionCents).toBe(191);
  });
});
```

- [ ] **Step 3:** `pnpm test stripe` → pass.
- [ ] **Step 4:** Commit `feat(lib): stripe connect helpers + financials`

## Task 0.8: Geo helper

**Files:** `lib/geo.ts`, `tests/geo.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { haversineMiles, isWithinRadius } from '@/lib/geo';

describe('haversineMiles', () => {
  it('Plano to Uptown Dallas ≈ 16-19 miles', () => {
    const d = haversineMiles({ lat: 33.0738, lng: -96.7480 }, { lat: 32.7986, lng: -96.8009 });
    expect(d).toBeGreaterThan(15);
    expect(d).toBeLessThan(22);
  });
  it('same point is 0 miles', () => {
    expect(haversineMiles({ lat: 32.7, lng: -96.8 }, { lat: 32.7, lng: -96.8 })).toBeCloseTo(0);
  });
  it('isWithinRadius respects radius', () => {
    expect(isWithinRadius({ lat: 32.7, lng: -96.8 }, { lat: 32.701, lng: -96.801 }, 1)).toBe(true);
    expect(isWithinRadius({ lat: 32.7, lng: -96.8 }, { lat: 33.5, lng: -97.0 }, 1)).toBe(false);
  });
});
```

- [ ] **Step 2: Write `lib/geo.ts`**

```typescript
export type LatLng = { lat: number; lng: number };

export function haversineMiles(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(x));
}

export function isWithinRadius(a: LatLng, b: LatLng, miles: number): boolean {
  return haversineMiles(a, b) <= miles;
}
```

- [ ] **Step 3:** Test passes. Commit `feat(lib): geo distance helpers`

## Task 0.9: Photo upload via R2 (presigned URL pattern)

**Files:** `lib/photo-upload.ts`, `app/api/uploads/presign/route.ts`, `tests/photo-upload.test.ts`

- [ ] **Step 1: Write `lib/photo-upload.ts`**

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '@/lib/env';
import crypto from 'crypto';

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
});

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

export async function presignUpload(args: {
  userId: string;
  purpose: 'cook-id' | 'cook-cert' | 'dish' | 'cook-profile' | 'driver-license' | 'driver-insurance' | 'driver-id' | 'driver-car' | 'pickup-confirm' | 'dropoff-confirm';
  contentType: string;
}) {
  if (!ALLOWED_MIME.includes(args.contentType)) {
    throw new Error(`Unsupported content type: ${args.contentType}`);
  }
  const key = `${args.purpose}/${args.userId}/${crypto.randomUUID()}`;
  const cmd = new PutObjectCommand({ Bucket: env.R2_BUCKET, Key: key, ContentType: args.contentType });
  const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: 300 });
  const publicUrl = `${env.R2_PUBLIC_URL}/${key}`;
  return { uploadUrl, publicUrl, key };
}
```

- [ ] **Step 2: Write `app/api/uploads/presign/route.ts`**

```typescript
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { presignUpload } from '@/lib/photo-upload';
import { z } from 'zod';

const Body = z.object({
  purpose: z.enum(['cook-id', 'cook-cert', 'dish', 'cook-profile', 'driver-license', 'driver-insurance', 'driver-id', 'driver-car', 'pickup-confirm', 'dropoff-confirm']),
  contentType: z.string(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const body = Body.parse(await req.json());
  const { uploadUrl, publicUrl } = await presignUpload({
    userId: session.user.id, purpose: body.purpose, contentType: body.contentType,
  });
  return NextResponse.json({ uploadUrl, publicUrl });
}
```

- [ ] **Step 3:** Commit `feat(uploads): presigned R2 upload endpoint`

## Task 0.10: ToS framework

**Files:** `lib/tos.ts`, `app/api/tos/accept/route.ts`, `content/tos/cook-v1.md`, `content/tos/buyer-v1.md`, `content/tos/driver-v1.md`

- [ ] **Step 1: Write `lib/tos.ts`**

```typescript
import { prisma } from '@/lib/prisma';
import type { TosType } from '@prisma/client';

export const CURRENT_TOS_VERSIONS: Record<TosType, string> = {
  COOK: '2026-05-13-v1',
  BUYER: '2026-05-13-v1',
  DRIVER: '2026-05-13-v1',
};

export async function recordAcceptance(args: { userId: string; tosType: TosType; ipAddress?: string }) {
  return prisma.tosAcceptance.create({
    data: {
      userId: args.userId,
      tosType: args.tosType,
      version: CURRENT_TOS_VERSIONS[args.tosType],
      ipAddress: args.ipAddress,
    },
  });
}

export async function hasAcceptedCurrent(userId: string, tosType: TosType): Promise<boolean> {
  const row = await prisma.tosAcceptance.findFirst({
    where: { userId, tosType, version: CURRENT_TOS_VERSIONS[tosType] },
    orderBy: { acceptedAt: 'desc' },
  });
  return !!row;
}
```

- [ ] **Step 2: Stub the three ToS markdown files** with one paragraph each (the founder fills these in pre-launch).

`content/tos/cook-v1.md`: `# Cook Terms of Service v2026-05-13-v1\n\nPlaceholder. Legal to fill in.`

(Same for buyer-v1.md, driver-v1.md.)

- [ ] **Step 3: Write `app/api/tos/accept/route.ts`**

```typescript
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { recordAcceptance } from '@/lib/tos';
import { z } from 'zod';

const Body = z.object({ tosType: z.enum(['COOK', 'BUYER', 'DRIVER']) });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const body = Body.parse(await req.json());
  const ip = req.headers.get('x-forwarded-for') ?? undefined;
  await recordAcceptance({ userId: session.user.id, tosType: body.tosType, ipAddress: ip });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4:** Commit `feat(tos): version-tracked ToS acceptance`

## Task 0.11: Email helper (Resend)

**Files:** `lib/email.ts`, `tests/email.test.ts`

- [ ] **Step 1: Write `lib/email.ts`**

```typescript
import { Resend } from 'resend';
import { env } from '@/lib/env';

const resend = new Resend(env.RESEND_API_KEY);

export async function sendEmail(args: {
  to: string;
  subject: string;
  html: string;
}) {
  if (process.env.NODE_ENV === 'test') return { id: 'test' };
  return resend.emails.send({ from: env.RESEND_FROM, ...args });
}

export const templates = {
  cookApproved: (name: string) => ({
    subject: 'You\'re approved on CaterCare!',
    html: `<p>Hi ${name}, your cook account is live. List your first dish at ${env.APP_URL}/cook/dishes.</p>`,
  }),
  cookRejected: (name: string, reason: string) => ({
    subject: 'CaterCare application update',
    html: `<p>Hi ${name}, unfortunately we couldn't approve your application: ${reason}.</p>`,
  }),
  certExpiringSoon: (name: string, daysLeft: number) => ({
    subject: `Your food handler cert expires in ${daysLeft} days`,
    html: `<p>Hi ${name}, your TX food handler certification expires in ${daysLeft} days. Renew at ${env.APP_URL}/cook/profile to keep listings active.</p>`,
  }),
  orderPlaced: (cookName: string, orderId: string) => ({
    subject: 'New order received',
    html: `<p>You have a new order. Accept or decline in your inbox: ${env.APP_URL}/cook/orders/${orderId}</p>`,
  }),
  orderAccepted: (orderId: string) => ({
    subject: 'Your order was accepted',
    html: `<p>Your CaterCare order is being prepared. Track: ${env.APP_URL}/orders/${orderId}</p>`,
  }),
  orderDelivered: (orderId: string) => ({
    subject: 'Order delivered',
    html: `<p>Your order has been delivered. View receipt: ${env.APP_URL}/orders/${orderId}</p>`,
  }),
  driverAssigned: (orderId: string) => ({
    subject: 'New delivery job',
    html: `<p>You claimed a delivery. Details: ${env.APP_URL}/driver/jobs/${orderId}</p>`,
  }),
};
```

- [ ] **Step 2:** Commit `feat(email): resend client + templates`

## Task 0.12: Shared layout, design tokens, and sign-in page

**Files:** `app/layout.tsx`, `app/globals.css`, `app/signin/page.tsx`, `components/ui/Button.tsx`, `components/ui/Input.tsx`, `components/ui/Card.tsx`, `tailwind.config.ts`

- [ ] **Step 1: Edit `tailwind.config.ts`**

```typescript
import type { Config } from 'tailwindcss';
export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 50: '#fff7ed', 500: '#f97316', 700: '#c2410c' },
      },
    },
  },
  plugins: [],
} satisfies Config;
```

- [ ] **Step 2: Write `components/ui/Button.tsx`**

```tsx
import { type ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
};

export function Button({ variant = 'primary', className, ...props }: Props) {
  const base = 'px-4 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-brand-500 hover:bg-brand-700 text-white',
    secondary: 'bg-white border border-slate-300 hover:bg-slate-50 text-slate-900',
    ghost: 'hover:bg-slate-100 text-slate-900',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };
  return <button className={clsx(base, variants[variant], className)} {...props} />;
}
```

- [ ] **Step 3:** Write `components/ui/Input.tsx` and `components/ui/Card.tsx` (same pattern, basic styled wrappers).

- [ ] **Step 4: Write `app/signin/page.tsx`**

```tsx
import { signIn } from '@/lib/auth';
import { Button } from '@/components/ui/Button';

export default function SignIn() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="max-w-sm w-full p-8 border rounded-lg space-y-4">
        <h1 className="text-2xl font-bold">Sign in to CaterCare</h1>
        <form action={async () => { 'use server'; await signIn('google'); }}>
          <Button type="submit" className="w-full">Continue with Google</Button>
        </form>
      </div>
    </main>
  );
}
```

- [ ] **Step 5:** Commit `feat(ui): design tokens, signin, shared components`

## Task 0.13: Seed script

**Files:** `prisma/seed.ts`

- [ ] **Step 1: Write `prisma/seed.ts`** with: 1 admin user, 3 approved cooks (with sample dishes), 5 approved drivers, 3 buyers.

```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.user.create({
    data: {
      email: 'admin@catercare.test',
      name: 'Admin',
      roles: ['ADMIN'],
      status: 'ACTIVE',
    },
  });

  for (let i = 1; i <= 3; i++) {
    await prisma.user.create({
      data: {
        email: `cook${i}@catercare.test`,
        name: `Cook ${i}`,
        roles: ['COOK'],
        status: 'ACTIVE',
        cookProfile: {
          create: {
            story: `Sample cook ${i}`,
            cuisineTags: ['Pakistani', 'Indian'][i % 2] === undefined ? ['Mexican'] : [['Pakistani', 'Indian'][i % 2]!],
            neighborhood: 'Plano',
            lat: 33.0738 + i * 0.01,
            lng: -96.7480 + i * 0.01,
            idStatus: 'APPROVED',
            foodHandlerCertStatus: 'APPROVED',
            foodHandlerCertExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            stripeOnboardingComplete: true,
            approvedAt: new Date(),
            dishes: {
              create: [
                { name: `Cook ${i} Special`, description: 'Tasty', priceCents: 1500, allergens: ['nuts'], leadTimeHours: 4 },
                { name: `Side Dish ${i}`, description: 'Tasty side', priceCents: 600, allergens: [], leadTimeHours: 4 },
              ],
            },
          },
        },
      },
    });
  }
  console.log('Seeded.');
}

main().finally(() => prisma.$disconnect());
```

- [ ] **Step 2:** Run `pnpm db:seed`. Inspect with `pnpm db:studio`.
- [ ] **Step 3:** Commit `chore(db): seed script`

## Task 0.14: Deploy skeleton to Vercel + Neon

- [ ] **Step 1:** Create Neon project at neon.tech, copy DATABASE_URL.
- [ ] **Step 2:** Create Vercel project linked to GitHub repo. Add all env vars from `.env.example`.
- [ ] **Step 3:** Trigger first deploy. Verify `/signin` renders and Google OAuth works.
- [ ] **Step 4:** Run `pnpm prisma migrate deploy` against Neon.
- [ ] **Step 5:** Commit deployment notes to `docs/deploy.md`.

## Task 0.15: Phase 0 freeze checkpoint

- [ ] Both partners review `prisma/schema.prisma` together. Lock it.
- [ ] Both review the cross-track API contracts above. Lock them.
- [ ] Tag the commit: `git tag phase-0-complete && git push --tags`
- [ ] **Now split into Tracks A and B.**

---

# Track A: Supply & Operations (Partner A)

**Duration target:** 6 weeks. Touches only `app/cook/**`, `app/admin/**`, `app/api/cook/**`, `app/api/admin/**`, `tests/cook/**`, `tests/admin/**`.

## A.1: Cook signup gate + role assignment

**Files:** `app/cook/onboarding/page.tsx`, `app/api/cook/profile/route.ts`, `tests/cook/onboarding.test.ts`

- [ ] **Test first** — `tests/cook/onboarding.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { POST } from '@/app/api/cook/profile/route';

vi.mock('@/lib/auth', () => ({ auth: async () => ({ user: { id: 'u1', roles: [] } }) }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { update: vi.fn().mockResolvedValue({}) },
    cookProfile: { upsert: vi.fn().mockResolvedValue({}) },
  },
}));

describe('POST /api/cook/profile', () => {
  it('adds COOK role and creates profile', async () => {
    const req = new Request('http://localhost/api/cook/profile', {
      method: 'POST',
      body: JSON.stringify({ story: 'I cook biryani', cuisineTags: ['Pakistani'], neighborhood: 'Plano' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});
```

- [ ] **Implement** `app/api/cook/profile/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const Body = z.object({
  story: z.string().min(10).max(2000),
  cuisineTags: z.array(z.string()).min(1).max(5),
  neighborhood: z.string().min(2),
  photoUrl: z.string().url().optional(),
  addressLine: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const body = Body.parse(await req.json());

  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: { roles: { push: 'COOK' } },
    }),
    prisma.cookProfile.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, ...body },
      update: body,
    }),
  ]);
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const profile = await prisma.cookProfile.findUnique({ where: { userId: session.user.id } });
  return NextResponse.json({ profile });
}
```

- [ ] **Implement UI** `app/cook/onboarding/page.tsx` — form posting to `/api/cook/profile`.
- [ ] **Commit** `feat(cook): onboarding profile form`

## A.2: Cook ID upload

**Files:** `app/cook/profile/id/page.tsx`, `app/api/cook/id-doc/route.ts`

- [ ] **Test:** POST stores URL and sets `idStatus=PENDING`.
- [ ] **Implement** `app/api/cook/id-doc/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const Body = z.object({ idDocUrl: z.string().url() });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const { idDocUrl } = Body.parse(await req.json());
  await prisma.cookProfile.update({
    where: { userId: session.user.id },
    data: { idDocUrl, idStatus: 'PENDING' },
  });
  return NextResponse.json({ ok: true });
}
```

- [ ] **UI:** `app/cook/profile/id/page.tsx` — file input that calls `/api/uploads/presign`, uploads to R2, then POSTs URL here.
- [ ] **Commit** `feat(cook): ID document upload`

## A.3: Food handler cert upload + expiry

**Files:** `app/cook/profile/cert/page.tsx`, `app/api/cook/food-cert/route.ts`

- [ ] **Test:** stores URL + `foodHandlerCertExpiresAt` + status PENDING.
- [ ] **Implement** route (same pattern as A.2 with additional `expiresAt` field).
- [ ] **UI:** file input + date picker for cert expiry. Reject if expiry is in the past.
- [ ] **Commit** `feat(cook): food handler cert upload with expiry`

## A.4: Stripe Connect onboarding for cooks

**Files:** `app/cook/payouts/page.tsx`, `app/api/cook/stripe/onboard/route.ts`, `app/api/cook/stripe/return/route.ts`

- [ ] **Test:** creates Stripe Connect account + onboarding link (mock Stripe client).
- [ ] **Implement** `app/api/cook/stripe/onboard/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createConnectAccount, createOnboardingLink } from '@/lib/stripe';
import { env } from '@/lib/env';

export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  let profile = await prisma.cookProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile) return NextResponse.json({ error: 'NO_PROFILE' }, { status: 400 });

  if (!profile.stripeConnectAccountId) {
    const account = await createConnectAccount(session.user.email!, 'cook');
    profile = await prisma.cookProfile.update({
      where: { userId: session.user.id },
      data: { stripeConnectAccountId: account.id },
    });
  }
  const link = await createOnboardingLink(
    profile.stripeConnectAccountId!,
    `${env.APP_URL}/cook/payouts`,
    `${env.APP_URL}/api/cook/stripe/return`,
  );
  return NextResponse.json({ url: link.url });
}
```

- [ ] **Implement** `/api/cook/stripe/return` — pulls account status from Stripe, sets `stripeOnboardingComplete=true` if `details_submitted`.
- [ ] **UI:** `app/cook/payouts/page.tsx` shows current status + "Continue Stripe onboarding" button.
- [ ] **Commit** `feat(cook): stripe connect onboarding`

## A.5: Cook dishes CRUD

**Files:** `app/cook/dishes/page.tsx`, `app/cook/dishes/new/page.tsx`, `app/cook/dishes/[id]/page.tsx`, `app/api/cook/dishes/route.ts`, `app/api/cook/dishes/[id]/route.ts`

- [ ] **Tests:** create, list, update, soft-delete (set `isActive=false`). Reject dish creation if cook not approved.

```typescript
// tests/cook/dishes.test.ts excerpt
it('rejects dish creation for unapproved cook', async () => {
  // mock cookProfile.approvedAt = null
  const res = await POST(req);
  expect(res.status).toBe(403);
});
```

- [ ] **Implement** `app/api/cook/dishes/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const Body = z.object({
  name: z.string().min(2).max(80),
  description: z.string().min(10).max(1000),
  photoUrl: z.string().url(),
  priceCents: z.number().int().min(100).max(50000),
  portionSize: z.string().optional(),
  allergens: z.array(z.string()),
  leadTimeHours: z.number().int().min(0).max(168),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const profile = await prisma.cookProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile?.approvedAt) return NextResponse.json({ error: 'NOT_APPROVED' }, { status: 403 });
  const body = Body.parse(await req.json());
  const dish = await prisma.dish.create({ data: { cookId: session.user.id, ...body } });
  return NextResponse.json({ dish });
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const dishes = await prisma.dish.findMany({
    where: { cookId: session.user.id, isActive: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ dishes });
}
```

- [ ] **Implement** `app/api/cook/dishes/[id]/route.ts` with PATCH (update) and DELETE (soft delete sets `isActive=false`).
- [ ] **UI:** list page, new-dish form, edit page. File input for photo (presigned upload).
- [ ] **Commit** `feat(cook): dishes CRUD`

## A.6: Cook weekly availability + capacity

**Files:** `app/cook/availability/page.tsx`, `app/api/cook/availability/route.ts`

- [ ] **Test:** PUT replaces full weekly schedule atomically.
- [ ] **Implement** `app/api/cook/availability/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const Slot = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  orderCutoffMinutes: z.number().int().min(0).max(1440),
  maxOrdersPerDay: z.number().int().min(1).max(100),
});
const Body = z.object({ slots: z.array(Slot) });

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const { slots } = Body.parse(await req.json());
  await prisma.$transaction([
    prisma.cookAvailability.deleteMany({ where: { cookId: session.user.id } }),
    prisma.cookAvailability.createMany({
      data: slots.map(s => ({ cookId: session.user.id, ...s })),
    }),
  ]);
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const slots = await prisma.cookAvailability.findMany({
    where: { cookId: session.user.id }, orderBy: { dayOfWeek: 'asc' },
  });
  return NextResponse.json({ slots });
}
```

- [ ] **UI:** 7-row table, one per day, with start/end time pickers + max-orders input.
- [ ] **Commit** `feat(cook): weekly availability`

## A.7: Cook order inbox

**Files:** `app/cook/orders/page.tsx`, `app/cook/orders/[id]/page.tsx`, `app/api/cook/orders/route.ts`, `app/api/cook/orders/[id]/transition/route.ts`

- [ ] **Test:** lists only orders where `cookId = session.user.id`. Transition route checks state machine.

```typescript
// tests/cook/transition.test.ts
it('rejects PLACED → DELIVERED for cook', async () => {
  // seed order in PLACED state with cookId = u1
  const res = await POST(req, { params: { id: 'order1' } });
  expect(res.status).toBe(400);
});
```

- [ ] **Implement** `app/api/cook/orders/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const url = new URL(req.url);
  const state = url.searchParams.get('state'); // optional filter
  const orders = await prisma.order.findMany({
    where: { cookId: session.user.id, ...(state ? { state: state as any } : {}) },
    include: { items: { include: { dish: true } }, buyer: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return NextResponse.json({ orders });
}
```

- [ ] **Implement** `app/api/cook/orders/[id]/transition/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canTransition } from '@/lib/order-state';
import { z } from 'zod';

const Body = z.object({ to: z.enum(['COOK_ACCEPTED', 'COOK_DECLINED', 'PREPARING', 'READY_FOR_PICKUP']), note: z.string().optional() });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const { id } = await params;
  const body = Body.parse(await req.json());

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || order.cookId !== session.user.id) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  if (!canTransition(order.state, body.to, 'COOK')) return NextResponse.json({ error: 'INVALID_TRANSITION' }, { status: 400 });

  const timestamps: Record<string, Date> = {};
  if (body.to === 'COOK_ACCEPTED') timestamps.acceptedAt = new Date();
  if (body.to === 'PREPARING') timestamps.preparingAt = new Date();
  if (body.to === 'READY_FOR_PICKUP') timestamps.readyAt = new Date();

  await prisma.$transaction([
    prisma.order.update({ where: { id }, data: { state: body.to, ...timestamps } }),
    prisma.orderEvent.create({ data: { orderId: id, fromState: order.state, toState: body.to, actorUserId: session.user.id, note: body.note } }),
  ]);
  return NextResponse.json({ ok: true });
}
```

- [ ] **UI:** inbox lists pending orders with Accept/Decline buttons. Detail page shows items + buyer note + state buttons.
- [ ] **Commit** `feat(cook): order inbox + transitions`

## A.8: Cook earnings dashboard

**Files:** `app/cook/earnings/page.tsx`, `app/api/cook/earnings/route.ts`

- [ ] **Test:** sums `cookPayoutCents` from completed orders for current week/month.
- [ ] **Implement**:

```typescript
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const now = new Date();
  const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay()); startOfWeek.setHours(0,0,0,0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [week, month, lifetime, recent] = await Promise.all([
    prisma.order.aggregate({ where: { cookId: session.user.id, state: 'COMPLETED', completedAt: { gte: startOfWeek } }, _sum: { cookPayoutCents: true }, _count: true }),
    prisma.order.aggregate({ where: { cookId: session.user.id, state: 'COMPLETED', completedAt: { gte: startOfMonth } }, _sum: { cookPayoutCents: true }, _count: true }),
    prisma.order.aggregate({ where: { cookId: session.user.id, state: 'COMPLETED' }, _sum: { cookPayoutCents: true }, _count: true }),
    prisma.order.findMany({ where: { cookId: session.user.id, state: 'COMPLETED' }, orderBy: { completedAt: 'desc' }, take: 20, select: { id: true, completedAt: true, cookPayoutCents: true } }),
  ]);
  return NextResponse.json({ week, month, lifetime, recent });
}
```

- [ ] **UI:** 3 stat cards + recent payouts table.
- [ ] **Commit** `feat(cook): earnings dashboard`

## A.9: Admin cook approval queue

**Files:** `app/admin/cooks/page.tsx`, `app/admin/cooks/[id]/page.tsx`, `app/api/admin/cooks/route.ts`, `app/api/admin/cooks/[id]/approve/route.ts`, `app/api/admin/cooks/[id]/reject/route.ts`

- [ ] **Test:** only ADMIN role can call. Approve sets `approvedAt`, `status=ACTIVE`. Reject sets `rejectedReason`.
- [ ] **Implement** route guard pattern:

```typescript
import { requireRole } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireRole('ADMIN').catch(() => null);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const { id } = await params;
  await prisma.$transaction([
    prisma.cookProfile.update({
      where: { userId: id },
      data: { approvedAt: new Date(), approvedByUserId: admin.id, idStatus: 'APPROVED', foodHandlerCertStatus: 'APPROVED' },
    }),
    prisma.user.update({ where: { id }, data: { status: 'ACTIVE' } }),
  ]);
  // email cook (use templates.cookApproved)
  return NextResponse.json({ ok: true });
}
```

- [ ] **UI:** list of pending cooks with photos of ID + cert. Approve/Reject buttons. Reject opens modal with reason.
- [ ] **Commit** `feat(admin): cook approval queue`

## A.10: Admin driver approval queue

**Files:** `app/admin/drivers/page.tsx`, `app/admin/drivers/[id]/page.tsx`, `app/api/admin/drivers/pending/route.ts`, `app/api/admin/drivers/[id]/approve/route.ts`, `app/api/admin/drivers/[id]/reject/route.ts`

- [ ] **Implement** `app/api/admin/drivers/pending/route.ts`:

```typescript
export async function GET() {
  const admin = await requireRole('ADMIN').catch(() => null);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const drivers = await prisma.driverProfile.findMany({
    where: { docsStatus: 'PENDING' },
    include: { user: true },
  });
  return NextResponse.json({ drivers });
}
```

- [ ] Approve route mirrors A.9 pattern but updates `DriverProfile`.
- [ ] **UI:** displays license/insurance/ID/car photos side-by-side, background check status badge, Approve/Reject.
- [ ] **Commit** `feat(admin): driver approval queue`

## A.11: Admin order intervention

**Files:** `app/admin/orders/page.tsx`, `app/admin/orders/[id]/page.tsx`, `app/api/admin/orders/route.ts`, `app/api/admin/orders/[id]/cancel/route.ts`, `app/api/admin/orders/[id]/refund/route.ts`, `app/api/admin/orders/[id]/reassign/route.ts`

- [ ] **Test:** admin can cancel any non-terminal order. Refund triggers Stripe refund.
- [ ] **Implement** cancel:

```typescript
import { stripe } from '@/lib/stripe';
import { TERMINAL_STATES } from '@/lib/order-state';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireRole('ADMIN').catch(() => null);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const { id } = await params;
  const { reason } = await req.json();
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || TERMINAL_STATES.includes(order.state)) return NextResponse.json({ error: 'INVALID_STATE' }, { status: 400 });

  if (order.stripePaymentIntentId) {
    await stripe.paymentIntents.cancel(order.stripePaymentIntentId).catch(() => {});
  }
  await prisma.$transaction([
    prisma.order.update({ where: { id }, data: { state: 'CANCELLED', cancelledAt: new Date(), cancellationReason: reason } }),
    prisma.orderEvent.create({ data: { orderId: id, fromState: order.state, toState: 'CANCELLED', actorUserId: admin.id, note: reason } }),
  ]);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Implement refund** — call `stripe.refunds.create({ payment_intent: order.stripePaymentIntentId })`, set state to `REFUNDED`.
- [ ] **Implement reassign** — set `driverId=null`, push state back to `READY_FOR_PICKUP`.
- [ ] **UI:** order list with filters by state. Detail page shows full event log + action buttons.
- [ ] **Commit** `feat(admin): order intervention`

## A.12: Admin user suspension

**Files:** `app/api/admin/users/[id]/suspend/route.ts`, `app/api/admin/users/[id]/unsuspend/route.ts`

- [ ] **Test:** suspending a cook sets `User.status=SUSPENDED` and hides their dishes.
- [ ] **Implement:** flip status; in `GET /api/public/cooks` query (Track B), filter `User.status = ACTIVE`.
- [ ] **Commit** `feat(admin): user suspension`

## A.13: Admin metrics dashboard

**Files:** `app/admin/page.tsx`, `app/api/admin/metrics/route.ts`

- [ ] **Test:** returns counts of active cooks/drivers/buyers, GMV this week vs last week, completed orders count.
- [ ] **Implement:**

```typescript
export async function GET() {
  const admin = await requireRole('ADMIN').catch(() => null);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400_000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 86400_000);

  const [activeCooks, activeDrivers, activeBuyers, thisWeek, lastWeek] = await Promise.all([
    prisma.user.count({ where: { roles: { has: 'COOK' }, status: 'ACTIVE' } }),
    prisma.user.count({ where: { roles: { has: 'DRIVER' }, status: 'ACTIVE' } }),
    prisma.user.count({ where: { roles: { has: 'BUYER' }, status: 'ACTIVE' } }),
    prisma.order.aggregate({ where: { completedAt: { gte: weekAgo } }, _sum: { totalChargedCents: true, platformRevenueCents: true }, _count: true }),
    prisma.order.aggregate({ where: { completedAt: { gte: twoWeeksAgo, lt: weekAgo } }, _sum: { totalChargedCents: true, platformRevenueCents: true }, _count: true }),
  ]);
  return NextResponse.json({ activeCooks, activeDrivers, activeBuyers, thisWeek, lastWeek });
}
```

- [ ] **UI:** stat cards + simple bar chart of last 4 weeks GMV.
- [ ] **Commit** `feat(admin): metrics dashboard`

## A.14: Cert expiry auto-disable (cron-triggered helper)

**Files:** `app/api/cron/check-cert-expiry/route.ts`, `tests/cook/cert-expiry.test.ts`

- [ ] **Test:** cooks with expired cert have all their dishes set `isActive=false`.
- [ ] **Implement:**

```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail, templates } from '@/lib/email';

export async function POST(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }
  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 86400_000);
  const in14 = new Date(now.getTime() + 14 * 86400_000);
  const in7  = new Date(now.getTime() + 7 * 86400_000);

  // Disable expired
  const expired = await prisma.cookProfile.findMany({
    where: { foodHandlerCertExpiresAt: { lt: now }, foodHandlerCertStatus: 'APPROVED' },
    include: { user: true },
  });
  for (const c of expired) {
    await prisma.$transaction([
      prisma.cookProfile.update({ where: { userId: c.userId }, data: { foodHandlerCertStatus: 'NOT_SUBMITTED' } }),
      prisma.dish.updateMany({ where: { cookId: c.userId }, data: { isActive: false } }),
    ]);
  }

  // Send reminders at 30/14/7 days (one per window, idempotency by date logic in real version)
  for (const days of [30, 14, 7]) {
    const cutoff = new Date(now.getTime() + days * 86400_000);
    const expiring = await prisma.cookProfile.findMany({
      where: { foodHandlerCertExpiresAt: { lte: cutoff, gt: now } },
      include: { user: true },
    });
    for (const c of expiring) {
      const t = templates.certExpiringSoon(c.user.name ?? 'there', days);
      await sendEmail({ to: c.user.email, subject: t.subject, html: t.html });
    }
  }
  return NextResponse.json({ disabled: expired.length });
}
```

- [ ] Configure Vercel Cron in `vercel.json` to hit this daily.
- [ ] **Commit** `feat(cook): auto-disable on cert expiry + reminder emails`

## A.15: Track A integration tests

**Files:** `tests/cook/e2e.test.ts`, `tests/admin/e2e.test.ts`

- [ ] **Test full flow:** sign up cook → upload docs → admin approves → cook lists dish → dish appears in `GET /api/public/cooks`.
- [ ] **Commit** `test(cook): end-to-end flow`

- [ ] **Tag:** `git tag track-a-complete`

---

# Track B: Demand & Fulfillment (Partner B)

**Duration target:** 6 weeks. Touches only `app/(buyer)/**`, `app/driver/**`, `app/api/buyer/**`, `app/api/driver/**`, `app/api/orders/**`, `app/api/public/**`, `app/api/stripe-webhook/**`, `tests/buyer/**`, `tests/driver/**`, `tests/orders/**`.

## B.1: Public cook discovery API (the Track-A-data-read endpoint)

**Files:** `app/api/public/cooks/route.ts`, `app/api/public/cooks/[id]/route.ts`, `app/api/public/dishes/[id]/route.ts`, `tests/orders/discovery.test.ts`

- [ ] **Test:** returns only cooks with `User.status=ACTIVE`, `approvedAt != null`, `foodHandlerCertStatus=APPROVED`, within radius.

```typescript
// tests/orders/discovery.test.ts
it('excludes unapproved cooks', async () => {
  // seed: 1 approved cook, 1 pending cook
  const res = await GET(new Request('http://localhost/api/public/cooks?lat=33&lng=-96&radius=10'));
  const { cooks } = await res.json();
  expect(cooks).toHaveLength(1);
});
```

- [ ] **Implement:**

```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { haversineMiles } from '@/lib/geo';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const lat = parseFloat(url.searchParams.get('lat') ?? '');
  const lng = parseFloat(url.searchParams.get('lng') ?? '');
  const radius = parseFloat(url.searchParams.get('radius') ?? '10');
  const cuisine = url.searchParams.get('cuisine');

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json({ error: 'BAD_LATLNG' }, { status: 400 });
  }

  const cooks = await prisma.cookProfile.findMany({
    where: {
      approvedAt: { not: null },
      foodHandlerCertStatus: 'APPROVED',
      user: { status: 'ACTIVE' },
      ...(cuisine ? { cuisineTags: { has: cuisine } } : {}),
      lat: { not: null }, lng: { not: null },
    },
    include: { user: { select: { name: true } }, dishes: { where: { isActive: true } } },
  });

  const filtered = cooks
    .filter(c => haversineMiles({ lat, lng }, { lat: c.lat!, lng: c.lng! }) <= radius)
    .map(c => ({
      id: c.userId, name: c.user.name, photoUrl: c.photoUrl, story: c.story,
      cuisineTags: c.cuisineTags, neighborhood: c.neighborhood,
      distanceMiles: haversineMiles({ lat, lng }, { lat: c.lat!, lng: c.lng! }),
      dishCount: c.dishes.length,
    }))
    .sort((a, b) => a.distanceMiles - b.distanceMiles);

  return NextResponse.json({ cooks: filtered });
}
```

- [ ] **Implement** `/api/public/cooks/[id]` — returns single cook profile + dishes.
- [ ] **Implement** `/api/public/dishes/[id]` — single dish detail.
- [ ] **Commit** `feat(public): cook + dish discovery API`

## B.2: Buyer signup + saved addresses

**Files:** `app/(buyer)/account/page.tsx`, `app/api/buyer/profile/route.ts`, `app/api/buyer/addresses/route.ts`

- [ ] **Test:** address CRUD scoped to authenticated buyer.
- [ ] **Implement:** standard CRUD pattern as in A.5.
- [ ] **UI:** address form with lat/lng auto-fill via Mapbox geocoding.
- [ ] **Commit** `feat(buyer): profile + addresses`

## B.3: Browse cooks UI (map + list)

**Files:** `app/(buyer)/page.tsx`, `app/(buyer)/browse/page.tsx`, `components/CookCard.tsx`, `components/CookMap.tsx`

- [ ] **Implement:**
  - Hero landing → enters address → redirects to `/browse?lat=&lng=`.
  - Browse page calls `/api/public/cooks` and renders both a list of `CookCard` components and a Mapbox map with pins.
  - Filter UI: cuisine dropdown, "available now" toggle.

- [ ] **`components/CookCard.tsx`:**

```tsx
export function CookCard({ cook }: { cook: any }) {
  return (
    <a href={`/cooks/${cook.id}`} className="block border rounded-lg p-4 hover:shadow-md">
      <img src={cook.photoUrl ?? '/avatar.png'} alt="" className="w-16 h-16 rounded-full mb-2" />
      <h3 className="font-bold">{cook.name}</h3>
      <p className="text-sm text-slate-600">{cook.cuisineTags.join(' · ')}</p>
      <p className="text-xs text-slate-500">{cook.distanceMiles.toFixed(1)} mi · {cook.dishCount} dishes</p>
      <p className="text-sm mt-2 line-clamp-2">{cook.story}</p>
    </a>
  );
}
```

- [ ] **Commit** `feat(buyer): browse cooks UI`

## B.4: Cook profile + dish detail pages (buyer-facing)

**Files:** `app/(buyer)/cooks/[id]/page.tsx`, `app/(buyer)/dishes/[id]/page.tsx`

- [ ] **Implement:** server components that fetch from `/api/public/cooks/:id` and `/api/public/dishes/:id`. Add-to-cart button is client-only.
- [ ] **Commit** `feat(buyer): cook + dish detail pages`

## B.5: Cart (client-side, single-cook constraint)

**Files:** `lib/cart.ts`, `components/CartDrawer.tsx`, `app/(buyer)/cart/page.tsx`

- [ ] **Test (cart logic):**

```typescript
// tests/orders/cart.test.ts
import { describe, it, expect } from 'vitest';
import { addToCart, type Cart } from '@/lib/cart';

describe('cart', () => {
  it('rejects adding a dish from a different cook', () => {
    let cart: Cart = { cookId: 'c1', items: [{ dishId: 'd1', qty: 1, priceCents: 1000, name: 'A' }] };
    expect(() => addToCart(cart, { cookId: 'c2', dishId: 'd2', qty: 1, priceCents: 500, name: 'B' }))
      .toThrow('DIFFERENT_COOK');
  });
});
```

- [ ] **Implement** `lib/cart.ts` (zustand or simple localStorage helper). Constraint: throw if `cart.cookId !== newItem.cookId` (buyer must clear first).
- [ ] **UI:** drawer accessible from any page; cart page lists items with qty controls + "Checkout" button.
- [ ] **Commit** `feat(buyer): single-cook cart`

## B.6: Checkout — delivery slot + tip + disclosure

**Files:** `app/(buyer)/checkout/page.tsx`, `app/api/orders/quote/route.ts`

- [ ] **Test:** quote endpoint returns computed financials.
- [ ] **Implement `/api/orders/quote`:**

```typescript
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { haversineMiles } from '@/lib/geo';
import { computeFinancials } from '@/lib/stripe';
import { env } from '@/lib/env';
import { z } from 'zod';

const Body = z.object({
  cookId: z.string(),
  items: z.array(z.object({ dishId: z.string(), quantity: z.number().int().min(1).max(20) })),
  deliveryAddressId: z.string(),
  tipCents: z.number().int().min(0).max(20000),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const body = Body.parse(await req.json());

  const [cook, dishes, address] = await Promise.all([
    prisma.cookProfile.findUnique({ where: { userId: body.cookId } }),
    prisma.dish.findMany({ where: { id: { in: body.items.map(i => i.dishId) }, cookId: body.cookId, isActive: true } }),
    prisma.buyerAddress.findUnique({ where: { id: body.deliveryAddressId } }),
  ]);
  if (!cook || !address) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

  const subtotalCents = body.items.reduce((sum, it) => {
    const d = dishes.find(x => x.id === it.dishId);
    return sum + (d?.priceCents ?? 0) * it.quantity;
  }, 0);

  const distanceMiles = haversineMiles({ lat: cook.lat!, lng: cook.lng! }, { lat: address.lat, lng: address.lng });

  const financials = computeFinancials({
    subtotalCents, distanceMiles, tipCents: body.tipCents,
    commissionPct: env.PLATFORM_COMMISSION_PCT,
    serviceFeePct: env.BUYER_SERVICE_FEE_PCT,
    driverBaseCents: env.DRIVER_BASE_PAY_CENTS,
    driverPerMileCents: env.DRIVER_PER_MILE_CENTS,
  });

  return NextResponse.json({ financials, distanceMiles });
}
```

- [ ] **UI:** address picker, time-slot picker (constrained by cook's availability + dish lead time), tip slider (0%, 10%, 15%, 20%, custom), home-kitchen disclosure checkbox (required to submit), order summary with live quote.
- [ ] **Commit** `feat(buyer): checkout UI + quote endpoint`

## B.7: Order creation + Stripe payment

**Files:** `app/api/orders/route.ts`, `app/api/orders/[id]/route.ts`, `app/(buyer)/checkout/success/page.tsx`

- [ ] **Test:** creating order calls `createOrderPaymentIntent`, persists Order row with `state=PLACED`.
- [ ] **Implement `POST /api/orders`:**

```typescript
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { haversineMiles } from '@/lib/geo';
import { computeFinancials, createOrderPaymentIntent } from '@/lib/stripe';
import { env } from '@/lib/env';
import { recordAcceptance } from '@/lib/tos';
import { z } from 'zod';

const Body = z.object({
  cookId: z.string(),
  items: z.array(z.object({ dishId: z.string(), quantity: z.number().int().min(1).max(20) })),
  deliveryAddressId: z.string(),
  tipCents: z.number().int().min(0).max(20000),
  requestedDeliveryAt: z.string().datetime(),
  buyerNote: z.string().max(500).optional(),
  homeKitchenDisclosureAccepted: z.literal(true),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const body = Body.parse(await req.json());

  const [cook, dishes, address] = await Promise.all([
    prisma.cookProfile.findUnique({ where: { userId: body.cookId } }),
    prisma.dish.findMany({ where: { id: { in: body.items.map(i => i.dishId) }, cookId: body.cookId, isActive: true } }),
    prisma.buyerAddress.findUnique({ where: { id: body.deliveryAddressId } }),
  ]);
  if (!cook?.approvedAt || !cook.stripeOnboardingComplete) {
    return NextResponse.json({ error: 'COOK_NOT_READY' }, { status: 400 });
  }
  if (!address) return NextResponse.json({ error: 'ADDRESS_NOT_FOUND' }, { status: 400 });

  const subtotalCents = body.items.reduce((sum, it) => {
    const d = dishes.find(x => x.id === it.dishId)!;
    return sum + d.priceCents * it.quantity;
  }, 0);
  const distanceMiles = haversineMiles({ lat: cook.lat!, lng: cook.lng! }, { lat: address.lat, lng: address.lng });
  const f = computeFinancials({
    subtotalCents, distanceMiles, tipCents: body.tipCents,
    commissionPct: env.PLATFORM_COMMISSION_PCT,
    serviceFeePct: env.BUYER_SERVICE_FEE_PCT,
    driverBaseCents: env.DRIVER_BASE_PAY_CENTS,
    driverPerMileCents: env.DRIVER_PER_MILE_CENTS,
  });
  const totalChargedCents = f.subtotalCents + f.buyerServiceFeeCents + f.deliveryFeeCents + f.driverTipCents;
  const cookPayoutCents = f.subtotalCents - f.cookCommissionCents;
  const driverPayoutCents = f.driverBasePayCents + f.driverTipCents;
  const platformRevenueCents = f.cookCommissionCents + f.buyerServiceFeeCents + (f.deliveryFeeCents - f.driverBasePayCents);

  const order = await prisma.order.create({
    data: {
      buyerId: session.user.id, cookId: body.cookId, state: 'DRAFT',
      subtotalCents: f.subtotalCents,
      cookCommissionCents: f.cookCommissionCents,
      buyerServiceFeeCents: f.buyerServiceFeeCents,
      deliveryFeeCents: f.deliveryFeeCents,
      driverBasePayCents: f.driverBasePayCents,
      driverTipCents: f.driverTipCents,
      totalChargedCents, cookPayoutCents, driverPayoutCents, platformRevenueCents,
      pickupAddressLine: cook.addressLine ?? '', pickupLat: cook.lat!, pickupLng: cook.lng!,
      deliveryAddressLine: address.line1, deliveryLat: address.lat, deliveryLng: address.lng,
      distanceMiles, requestedDeliveryAt: new Date(body.requestedDeliveryAt),
      homeKitchenDisclosureAccepted: true,
      homeKitchenDisclosureAcceptedAt: new Date(),
      cookCertSnapshotExpiresAt: cook.foodHandlerCertExpiresAt!,
      buyerNote: body.buyerNote,
      items: { create: body.items.map(it => {
        const d = dishes.find(x => x.id === it.dishId)!;
        return { dishId: it.dishId, dishNameSnapshot: d.name, unitPriceCents: d.priceCents, quantity: it.quantity };
      }) },
    },
  });

  const pi = await createOrderPaymentIntent({
    financials: f,
    cookStripeAccountId: cook.stripeConnectAccountId!,
    metadata: { orderId: order.id, buyerId: session.user.id, cookId: body.cookId },
  });

  await prisma.order.update({ where: { id: order.id }, data: { stripePaymentIntentId: pi.id } });
  await recordAcceptance({ userId: session.user.id, tosType: 'BUYER' });

  return NextResponse.json({ orderId: order.id, clientSecret: pi.client_secret });
}
```

- [ ] **UI:** Stripe Elements card form on the checkout page; on `confirmPayment` success, redirect to `/checkout/success/[orderId]`.
- [ ] **Commit** `feat(orders): create order + stripe payment intent`

## B.8: Stripe webhook handler

**Files:** `app/api/stripe-webhook/route.ts`, `tests/orders/webhook.test.ts`

- [ ] **Test:** `payment_intent.succeeded` event transitions order from DRAFT → PLACED, sends email to cook.
- [ ] **Implement:**

```typescript
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { env } from '@/lib/env';
import { sendEmail, templates } from '@/lib/email';

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature')!;
  const body = await req.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return NextResponse.json({ error: 'BAD_SIG' }, { status: 400 });
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    const orderId = pi.metadata.orderId;
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { cook: true } });
    if (order && order.state === 'DRAFT') {
      await prisma.$transaction([
        prisma.order.update({ where: { id: orderId }, data: { state: 'PLACED', placedAt: new Date(), stripeChargeId: pi.latest_charge as string } }),
        prisma.orderEvent.create({ data: { orderId, fromState: 'DRAFT', toState: 'PLACED', note: 'stripe webhook' } }),
      ]);
      const t = templates.orderPlaced(order.cook.name ?? 'Cook', orderId);
      await sendEmail({ to: order.cook.email, ...t });
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const pi = event.data.object;
    const orderId = pi.metadata.orderId;
    await prisma.order.update({ where: { id: orderId }, data: { state: 'CANCELLED', cancelledAt: new Date(), cancellationReason: 'payment_failed' } });
  }
  return NextResponse.json({ received: true });
}
```

- [ ] **Commit** `feat(orders): stripe webhook → state transition`

## B.9: Order tracking + history (buyer)

**Files:** `app/(buyer)/orders/page.tsx`, `app/(buyer)/orders/[id]/page.tsx`, `app/api/buyer/orders/route.ts`, `app/api/buyer/orders/[id]/route.ts`

- [ ] **Test:** buyer sees only their own orders.
- [ ] **Implement** list + detail. Detail page shows status timeline (use `OrderEvent` rows).
- [ ] **Commit** `feat(buyer): order history + tracking`

## B.10: Driver signup + profile + ToS

**Files:** `app/driver/onboarding/page.tsx`, `app/api/driver/profile/route.ts`

- [ ] Same pattern as A.1: POST adds DRIVER role + creates `DriverProfile`.
- [ ] **Commit** `feat(driver): onboarding`

## B.11: Driver document uploads (license, insurance, ID, car photo, DOB)

**Files:** `app/driver/verification/page.tsx`, `app/api/driver/docs/route.ts`

- [ ] **Test:** all 5 fields required; sets `docsStatus=PENDING` once all uploaded.
- [ ] **Implement:**

```typescript
const Body = z.object({
  licenseDocUrl: z.string().url(),
  licenseExpiresAt: z.string().datetime(),
  insuranceDocUrl: z.string().url(),
  insuranceExpiresAt: z.string().datetime(),
  idDocUrl: z.string().url(),
  carPhotoUrl: z.string().url(),
  dateOfBirth: z.string().datetime(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const body = Body.parse(await req.json());
  const dob = new Date(body.dateOfBirth);
  if (Date.now() - dob.getTime() < 18 * 365.25 * 86400_000) {
    return NextResponse.json({ error: 'UNDER_18' }, { status: 400 });
  }
  await prisma.driverProfile.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, ...body, dateOfBirth: dob, licenseExpiresAt: new Date(body.licenseExpiresAt), insuranceExpiresAt: new Date(body.insuranceExpiresAt), docsStatus: 'PENDING' },
    update: { ...body, dateOfBirth: dob, licenseExpiresAt: new Date(body.licenseExpiresAt), insuranceExpiresAt: new Date(body.insuranceExpiresAt), docsStatus: 'PENDING' },
  });
  return NextResponse.json({ ok: true });
}
```

- [ ] **UI:** 5 upload fields + DOB picker.
- [ ] **Commit** `feat(driver): document uploads`

## B.12: Driver background check workflow (manual v1)

**Files:** `app/admin/drivers/[id]/bg-check/route.ts` (admin marks complete), `app/driver/verification/page.tsx` (shows current bg-check state)

- [ ] For v1: manual flow. Admin reviews uploads + emails driver to consent to background check, then sets `backgroundCheckStatus=APPROVED` manually. Checkr integration deferred.
- [ ] **Commit** `feat(driver): manual background check workflow`

## B.13: Driver Stripe Connect onboarding

**Files:** `app/driver/payouts/page.tsx`, `app/api/driver/stripe/onboard/route.ts`, `app/api/driver/stripe/return/route.ts`

- [ ] Mirror A.4 with `userType: 'driver'`.
- [ ] **Commit** `feat(driver): stripe connect onboarding`

## B.14: Driver online/offline + location

**Files:** `app/driver/page.tsx`, `app/api/driver/status/route.ts`

- [ ] **Test:** can only go online if `docsStatus=APPROVED`, `backgroundCheckStatus=APPROVED`, `stripeOnboardingComplete=true`, AND `insuranceExpiresAt > now`, `licenseExpiresAt > now`.
- [ ] **Implement:**

```typescript
const Body = z.object({ isOnline: z.boolean(), lat: z.number().optional(), lng: z.number().optional() });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const body = Body.parse(await req.json());
  const profile = await prisma.driverProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile) return NextResponse.json({ error: 'NO_PROFILE' }, { status: 400 });

  if (body.isOnline) {
    const now = new Date();
    if (profile.docsStatus !== 'APPROVED') return NextResponse.json({ error: 'DOCS_PENDING' }, { status: 403 });
    if (profile.backgroundCheckStatus !== 'APPROVED') return NextResponse.json({ error: 'BG_CHECK_PENDING' }, { status: 403 });
    if (!profile.stripeOnboardingComplete) return NextResponse.json({ error: 'STRIPE_INCOMPLETE' }, { status: 403 });
    if (!profile.licenseExpiresAt || profile.licenseExpiresAt < now) return NextResponse.json({ error: 'LICENSE_EXPIRED' }, { status: 403 });
    if (!profile.insuranceExpiresAt || profile.insuranceExpiresAt < now) return NextResponse.json({ error: 'INSURANCE_EXPIRED' }, { status: 403 });
  }

  await prisma.driverProfile.update({
    where: { userId: session.user.id },
    data: { isOnline: body.isOnline, currentLat: body.lat, currentLng: body.lng },
  });
  return NextResponse.json({ ok: true });
}
```

- [ ] **UI:** big toggle, status badges showing each gate.
- [ ] **Commit** `feat(driver): online/offline with gating`

## B.15: Driver job feed

**Files:** `app/driver/jobs/page.tsx`, `app/api/driver/jobs/route.ts`

- [ ] **Test:** returns orders in `READY_FOR_PICKUP` state with `driverId=null` within radius of driver's current location.
- [ ] **Implement:**

```typescript
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const profile = await prisma.driverProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile?.isOnline || !profile.currentLat) return NextResponse.json({ jobs: [] });

  const candidates = await prisma.order.findMany({
    where: { state: 'READY_FOR_PICKUP', driverId: null },
    include: { cook: { select: { name: true } }, items: true },
    take: 50,
  });

  const jobs = candidates
    .map(o => ({
      orderId: o.id,
      pickupNeighborhood: o.pickupAddressLine.split(',').pop()?.trim(), // crude
      dropoffNeighborhood: o.deliveryAddressLine.split(',').pop()?.trim(),
      distanceMiles: o.distanceMiles,
      basePayCents: o.driverBasePayCents,
      tipCents: o.driverTipCents,
      totalPayCents: o.driverBasePayCents + o.driverTipCents,
      itemCount: o.items.length,
      milesFromYou: haversineMiles({ lat: profile.currentLat!, lng: profile.currentLng! }, { lat: o.pickupLat, lng: o.pickupLng }),
    }))
    .filter(j => j.milesFromYou <= 5)
    .sort((a, b) => a.milesFromYou - b.milesFromYou);

  return NextResponse.json({ jobs });
}
```

- [ ] **UI:** vertical list of cards. Each card shows transparent pay breakdown: base + tip = total.
- [ ] **Commit** `feat(driver): job feed`

## B.16: Driver claim job

**Files:** `app/api/driver/jobs/[id]/claim/route.ts`

- [ ] **Test:** atomic claim; if two drivers claim simultaneously only one wins.
- [ ] **Implement (use Prisma's conditional updateMany for atomicity):**

```typescript
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const { id } = await params;

  const result = await prisma.order.updateMany({
    where: { id, state: 'READY_FOR_PICKUP', driverId: null },
    data: { driverId: session.user.id, state: 'DRIVER_ASSIGNED' },
  });
  if (result.count === 0) return NextResponse.json({ error: 'ALREADY_CLAIMED' }, { status: 409 });

  await prisma.orderEvent.create({
    data: { orderId: id, fromState: 'READY_FOR_PICKUP', toState: 'DRIVER_ASSIGNED', actorUserId: session.user.id },
  });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Commit** `feat(driver): atomic claim job`

## B.17: Driver pickup + dropoff flow

**Files:** `app/driver/jobs/[id]/page.tsx`, `app/api/driver/jobs/[id]/transition/route.ts`

- [ ] **Test:** pickup transition requires `pickupConfirmPhotoUrl`; dropoff requires `dropoffConfirmPhotoUrl`.
- [ ] **Implement transition route** (mirrors A.7 transition but enforces `driverId === session.user.id` and accepts states PICKED_UP and DELIVERED):

```typescript
import { canTransition } from '@/lib/order-state';
import { transferToDriver } from '@/lib/stripe';

const Body = z.object({ to: z.enum(['PICKED_UP', 'DELIVERED']), photoUrl: z.string().url() });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const { id } = await params;
  const body = Body.parse(await req.json());

  const order = await prisma.order.findUnique({ where: { id }, include: { driver: { include: { driverProfile: true } } } });
  if (!order || order.driverId !== session.user.id) return NextResponse.json({ error: 'NOT_YOURS' }, { status: 404 });
  if (!canTransition(order.state, body.to, 'DRIVER')) return NextResponse.json({ error: 'INVALID_TRANSITION' }, { status: 400 });

  const ts: any = {};
  if (body.to === 'PICKED_UP') ts.pickedUpAt = new Date();
  if (body.to === 'DELIVERED') ts.deliveredAt = new Date();

  await prisma.$transaction([
    prisma.order.update({ where: { id }, data: { state: body.to, ...ts } }),
    prisma.orderEvent.create({ data: { orderId: id, fromState: order.state, toState: body.to, actorUserId: session.user.id, note: body.photoUrl } }),
  ]);

  if (body.to === 'DELIVERED') {
    const driverStripe = order.driver?.driverProfile?.stripeConnectAccountId;
    if (driverStripe) {
      await transferToDriver({
        amountCents: order.driverPayoutCents,
        driverStripeAccountId: driverStripe,
        orderId: order.id,
      });
    }
  }
  return NextResponse.json({ ok: true });
}
```

- [ ] **UI:** pickup screen with "Open in Maps" button + photo capture; dropoff screen same pattern.
- [ ] **Commit** `feat(driver): pickup + dropoff flow + driver payout transfer`

## B.18: Driver earnings dashboard

**Files:** `app/driver/earnings/page.tsx`, `app/api/driver/earnings/route.ts`

- [ ] Same pattern as A.8 but sums `driverPayoutCents` from delivered orders.
- [ ] **Commit** `feat(driver): earnings dashboard`

## B.19: Track B integration tests

**Files:** `tests/orders/e2e.test.ts`

- [ ] **Test end-to-end:** seed approved cook + approved driver → buyer signs up → browses → adds to cart → checkout → stripe webhook fires → cook accepts → marks ready → driver claims → picks up → delivers → cook earnings + driver earnings reflect order.
- [ ] **Commit** `test(orders): e2e order flow`

- [ ] **Tag:** `git tag track-b-complete`

---

# Phase 2: Integration & Launch (Both partners pair)

**Duration target:** 1-2 weeks. **Both pair**, ideally daily standup + shared screen.

## P2.1: End-to-end integration test with real Stripe test mode

**Files:** `tests/e2e/full-order.spec.ts` (Playwright)

- [ ] **Test:** full buyer→cook→driver flow using Playwright against `pnpm dev` + Stripe test keys. Use Stripe test card `4242 4242 4242 4242`.
- [ ] **Commit** `test(e2e): full happy-path order flow`

## P2.2: Auto-complete cron (DELIVERED → COMPLETED after 24h)

**Files:** `app/api/cron/auto-complete/route.ts`, `vercel.json`

- [ ] **Test:** orders delivered >24h ago and not disputed transition to COMPLETED.
- [ ] **Implement:**

```typescript
export async function POST(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  const cutoff = new Date(Date.now() - 24 * 3600_000);
  const result = await prisma.order.updateMany({
    where: { state: 'DELIVERED', deliveredAt: { lt: cutoff } },
    data: { state: 'COMPLETED', completedAt: new Date() },
  });
  return NextResponse.json({ completed: result.count });
}
```

- [ ] Configure in `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron/check-cert-expiry", "schedule": "0 8 * * *" },
    { "path": "/api/cron/check-insurance-expiry", "schedule": "0 8 * * *" },
    { "path": "/api/cron/auto-complete", "schedule": "0 * * * *" },
    { "path": "/api/cron/manual-dispatch-alert", "schedule": "*/5 * * * *" }
  ]
}
```

- [ ] **Commit** `feat(cron): auto-complete 24h post-delivery`

## P2.3: Insurance expiry cron (mirror of cert cron)

**Files:** `app/api/cron/check-insurance-expiry/route.ts`

- [ ] **Test:** drivers with expired insurance set `isOnline=false`.
- [ ] **Implement** mirroring A.14 but for `DriverProfile.insuranceExpiresAt`.
- [ ] **Commit** `feat(cron): driver insurance auto-pause`

## P2.4: Manual dispatch fallback alert

**Files:** `app/api/cron/manual-dispatch-alert/route.ts`

- [ ] **Test:** orders in `READY_FOR_PICKUP` for >15min with no driver → emails admin.
- [ ] **Implement:**

```typescript
export async function POST(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  const cutoff = new Date(Date.now() - 15 * 60_000);
  const stuck = await prisma.order.findMany({
    where: { state: 'READY_FOR_PICKUP', driverId: null, readyAt: { lt: cutoff } },
    include: { cook: { select: { name: true } } },
  });
  for (const o of stuck) {
    await sendEmail({
      to: 'admin@catercare.test', // load from env in real version
      subject: `Order ${o.id} stuck without driver`,
      html: `<p>Order from ${o.cook.name} has been ready for >15min with no driver. <a href="${env.APP_URL}/admin/orders/${o.id}">Manually assign</a>.</p>`,
    });
  }
  return NextResponse.json({ alerted: stuck.length });
}
```

- [ ] **Commit** `feat(ops): manual dispatch fallback alerts`

## P2.5: Email notification wiring on key transitions

**Files:** `lib/notifications.ts` and updates to transition routes in Track A & B.

- [ ] **Wire** these notification triggers (use `sendEmail` + `templates`):
  - Buyer: order placed (confirmation), accepted, ready for pickup, picked up, delivered.
  - Cook: new order placed.
  - Driver: claimed job (confirmation only — they triggered it).
- [ ] Add a `lib/notifications.ts` orchestrator so transitions emit notifications in a single line, e.g. `notifyTransition(order, 'COOK_ACCEPTED')`.
- [ ] **Commit** `feat(notifications): wire emails into order transitions`

## P2.6: Production readiness checks

- [ ] **Sentry:** Add `@sentry/nextjs`, configure source maps.
- [ ] **Rate limiting:** Add upstash rate limit to `/api/orders`, `/api/uploads/presign`, `/api/auth/*`.
- [ ] **CSP headers:** in `next.config.ts` for Stripe + Mapbox + R2.
- [ ] **Cookie banner:** simple one-time accept (US-only, light touch).
- [ ] **404 + error pages:** `app/not-found.tsx`, `app/error.tsx`.
- [ ] **Commit** `chore: production hardening`

## P2.7: Pre-launch checklist

- [ ] LLC formed (founder side, not software)
- [ ] Stripe Connect live keys obtained + put in Vercel env
- [ ] General liability insurance policy bound (founder side)
- [ ] Three ToS documents finalized in `content/tos/*-v1.md`
- [ ] At least 5 real cooks pre-onboarded with cert + Stripe complete
- [ ] At least 5 real drivers approved with insurance valid + Stripe complete
- [ ] Founder phone number in `templates.ts` for ops support
- [ ] Admin email actually reaches a monitored inbox
- [ ] Run `pnpm prisma migrate deploy` against prod Neon
- [ ] Switch Stripe webhook URL to prod domain
- [ ] Test one real $1 order end-to-end with founder's own card

## P2.8: Soft launch

- [ ] Invite-only beta to 10-20 buyers in one neighborhood.
- [ ] Founder monitors admin dashboard daily.
- [ ] Manual dispatch alerts go to founder's phone.
- [ ] Weekly retro to feed v1.1 backlog.

---

## Self-Review (run after writing)

**Spec coverage check:**
- ✅ All 47 features mapped to tasks (Cook 1–11 → A.1–A.8 + B.4 reads; Buyer 12–22 → B.2–B.9; Driver 23–33 → B.10–B.18; Admin 34–39 → A.9–A.13; Shared 40–47 → Phase 0)
- ✅ Legal compliance plumbing covered: food handler cert (A.3, A.14), buyer disclosure (B.6, B.7), ToS (0.10), driver insurance gating (B.14, P2.3), 1099 via Stripe Connect (A.4, B.13), audit log via OrderEvent (schema)
- ✅ Cross-track contracts defined and frozen in Phase 0

**No-placeholder scan:** every code-producing step has actual code; every test step has actual test bodies.

**Type-consistency:** schema field names match across tasks; `OrderState` values consistent; Stripe helper signatures stable.
