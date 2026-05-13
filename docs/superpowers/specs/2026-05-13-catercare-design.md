# CaterCare — Design Spec

**Date:** 2026-05-13
**Status:** Approved for implementation
**Geo target for launch:** One DFW neighborhood (TBD — Plano Legacy West or Uptown Dallas area)

---

## 1. Vision

A local home-food marketplace that lets people — especially immigrants and underprivileged folks — earn money by cooking and selling food from home. Buyers discover local home cooks by cuisine and proximity. Independent drivers sign up to deliver for per-delivery pay plus 100% of tips.

Closest existing references: Shef, WoodSpoon, Foodnome. None target the grassroots / immigrant-empowerment positioning.

## 2. Business model

Three-sided marketplace. Platform revenue:

| Source | Rate | Mechanism |
|---|---|---|
| Cook commission | 10–12% of dish subtotal | Deducted before payout to cook |
| Buyer service fee | 8–10% of subtotal | Added at checkout |
| Delivery margin | Variable | Buyer pays delivery fee; driver gets base pay; platform keeps spread |

Drivers receive **100% of tips, transparent** — exact tip amount visible in driver app, no pooling.

## 3. The three sides

- **Cook (seller)** — individual home cook. Sets their own schedule, lists dishes, accepts/declines orders.
- **Buyer** — local resident. Browses cooks nearby, orders a meal, pays with card, optionally tips.
- **Driver** — independent contractor with car/bike. Claims delivery jobs first-come-first-serve, gets paid per delivery + tips.

## 4. v1 Feature list

### Cook
1. Sign up + login
2. Cook profile (name, photo, story, cuisine tags, neighborhood)
3. ID verification upload (admin approves)
4. **Food handler certification upload + 2-year expiry tracking**
5. Stripe Connect payout onboarding
6. Dish listings: photo, name, description, price, portion size, allergens, lead time
7. Weekly availability + order cutoff time
8. Max-orders-per-day capacity cap
9. Order inbox: accept / decline within N minutes
10. Order workflow: preparing → ready for pickup
11. Earnings dashboard

### Buyer
12. Sign up + login
13. Saved delivery addresses
14. Browse cooks near me (map + list)
15. Filter: cuisine, availability ("available today" vs scheduled), price range
16. Cook profile + dish detail pages
17. Cart (single cook per order in v1)
18. Delivery time slot picker (respects cook lead time)
19. Stripe checkout + driver tip
20. **Home-kitchen disclosure + acknowledgment checkbox** at checkout
21. Order tracking (status timeline)
22. Order history + reorder

### Driver
23. Sign up + login (mobile-web optimized)
24. Verification: driver's license, auto insurance card, ID, 18+ age
25. **Background check** workflow (Checkr API or manual upload + admin approve)
26. Stripe Connect payout onboarding (collects W-9 automatically)
27. Go online / offline toggle
28. Available jobs feed (transparent base pay + tip breakdown)
29. Claim a job (first-come-first-serve)
30. Pickup flow with photo confirmation
31. Dropoff flow with photo confirmation
32. Earnings dashboard
33. **Auto insurance expiry tracking** — auto-pause when lapsed

### Admin (founder)
34. Cook approval queue
35. Driver approval queue
36. Order intervention: refund, reassign driver, force-cancel
37. Manual dispatch fallback (alert if no driver claims in N min)
38. User suspension (cook / buyer / driver)
39. Platform metrics: GMV, take rate, active users by role, completed orders

### Shared infrastructure
40. Stripe Connect 3-way split payments (buyer → platform + cook + driver)
41. Order state machine
42. Geo proximity (cook discovery + driver job feed)
43. Email notifications (Resend)
44. Photo upload + storage (Cloudflare R2 or S3)
45. Basic search (dishes, cooks, cuisine)
46. **Version-tracked ToS acknowledgments** (separate ToS for cook / buyer / driver)
47. Audit log of state transitions

## 5. Legal compliance baked into software

| Risk | Software handles | Outside software (founder handles) |
|---|---|---|
| Stripe shuts down account for unlicensed food prep | Mandatory TX food handler cert upload + expiry tracking creates documented safety program | — |
| Buyer gets sick + sues | Home-kitchen disclosure with "I acknowledge" checkbox at checkout; ToS waiver | LLC formation; general liability insurance (~$500–1500/yr) |
| Cook's food handler cert silently expires | Auto-disable cook's listings on expiry; email reminders at 30/14/7 days before | — |
| Driver crashes during delivery; personal auto insurance denies | Driver ToS disclaims commercial coverage; insurance proof tracked; rideshare endorsement recommended at onboarding | (Later: platform contingent liability policy) |
| Driver misclassification → accidental employee status | Drivers set hours, decline freely, no exclusivity/uniforms/scripts | Keep ToS aligned, don't drift |
| Unsafe cook or driver | ID verification + background check + admin manual approval queue | — |
| Tax reporting (1099-NEC) for cooks + drivers | Stripe Connect collects W-9 at onboarding and issues 1099-NEC automatically | — |
| User claims they never agreed to terms | Version-tracked ToS — signed version + timestamp stored in DB | — |
| Food poisoning incident, no records | Permanent order history, cook cert status, disclosure acknowledgments retained | Liability insurance covers claims |

## 6. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) + TypeScript | Single codebase covers all role dashboards; SSR for browse / SEO; React Server Components reduce client JS |
| Database | Postgres | Geo queries (PostGIS extension), strong relational guarantees for orders/payments |
| ORM | Prisma | Type-safe queries, painless migrations |
| Payments | Stripe Connect (Express accounts) | 3-way splits, automated 1099, W-9 collection, KYC handled by Stripe |
| Auth | Auth.js (NextAuth v5) with email + Google | Simple, role-aware sessions |
| File storage | Cloudflare R2 | S3-compatible, zero egress fees |
| Email | Resend | Modern API, transactional templates |
| Background checks | Checkr API (or manual v1) | Industry standard |
| Maps / geo | Mapbox GL (frontend) + PostGIS (backend) | Distance queries + map UI |
| Hosting | Vercel (web) + Neon or Supabase (Postgres) | Cheap to start, scales |
| Monitoring | Sentry + Vercel Analytics | Basic but enough |

## 7. Data model sketch

```
User
  id, email, role (COOK | BUYER | DRIVER | ADMIN can be multi), name, phone, createdAt
  status (PENDING | ACTIVE | SUSPENDED)

CookProfile (1:1 with User where role contains COOK)
  userId, photoUrl, story, neighborhood, lat, lng
  idVerificationDocUrl, idVerificationStatus
  foodHandlerCertUrl, foodHandlerCertExpiresAt
  stripeConnectAccountId
  approvedAt, approvedBy

DriverProfile (1:1)
  userId
  licenseDocUrl, licenseExpiresAt
  insuranceDocUrl, insuranceExpiresAt
  carPhotoUrl
  backgroundCheckStatus, backgroundCheckCompletedAt
  stripeConnectAccountId
  isOnline, currentLat, currentLng

BuyerProfile (1:1)
  userId
  addresses (1:N)

Dish
  id, cookId, name, description, photoUrl, price, portionSize
  allergens (array), leadTimeHours, isActive

CookAvailability
  cookId, dayOfWeek, startTime, endTime, orderCutoffMinutes, maxOrdersPerDay

Order
  id, buyerId, cookId, driverId (nullable)
  subtotal, cookCommission, buyerServiceFee, deliveryFee, driverTip, driverBasePay
  state (see state machine below)
  deliveryAddress, deliveryLat, deliveryLng
  requestedDeliveryAt, placedAt, acceptedAt, readyAt, pickedUpAt, deliveredAt
  homeKitchenDisclosureAcknowledged (bool + timestamp)
  stripePaymentIntentId

OrderItem
  orderId, dishId, quantity, priceAtOrder

OrderEvent (audit log)
  orderId, fromState, toState, actorId, timestamp, note

TosAcceptance
  userId, tosType (COOK | BUYER | DRIVER), version, acceptedAt
```

## 8. Order state machine

```
DRAFT
  ↓ (buyer checks out)
PLACED ──────────────────────┐
  ↓ (cook accepts)            │ (cook declines or times out)
COOK_ACCEPTED                 │
  ↓                           │
PREPARING                     │
  ↓ (cook marks ready)        │
READY_FOR_PICKUP              │
  ↓ (driver claims)           │
DRIVER_ASSIGNED               │
  ↓ (driver picks up)         │
PICKED_UP                     │
  ↓ (driver delivers)         ↓
DELIVERED ─────────────→ CANCELLED / REFUNDED
  ↓ (24h auto)
COMPLETED (funds released)
```

Each transition writes an `OrderEvent` row for audit.

## 9. Out of scope for v1 (deferred to v1.1+)

- Ratings & reviews
- Real-time GPS map of driver
- In-app chat (use SMS / email)
- Native iOS/Android apps
- Multi-cook carts
- Subscription / recurring orders
- Promo codes / referrals
- Multi-city expansion
- Group ordering (corporate catering features from the PDF)
- Enterprise invoicing, net-30, PO matching
- KDS / POS integrations (Toast, Square)
- White-glove buffet setup compensation
- Vehicle photo verification (heavy-equipment) — not needed for individual meals

## 10. Success criteria for v1

- 10+ approved cooks listing dishes
- 20+ approved drivers
- 100 completed orders in one neighborhood
- Stripe account in good standing (no holds)
- Zero food-safety incidents
- Buyer NPS positive enough to support v1.1 investment
