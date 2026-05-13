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
7. **Dish category selection: Non-TCS (shelf-stable) vs TCS (refrigerated/prepared meal)** — determines DSHS registration requirement and delivery rules
8. **Prohibited item acknowledgment at dish creation** — cook confirms dish contains no meat/poultry/seafood/ice cream/raw milk (TX cottage food law)
9. **DSHS registration upload + tracking for cooks listing TCS dishes** (mandatory per TX SB 541)
10. **Annual earnings cap warning at $125K and $145K GMV** — alert cook they are approaching the $150K TX cottage food cap; above it they need a commercial permit
11. Weekly availability + order cutoff time
12. Max-orders-per-day capacity cap
13. Order inbox: accept / decline within N minutes
14. Order workflow: preparing → ready for pickup
15. Earnings dashboard

### Buyer
16. Sign up + login
17. Saved delivery addresses
18. Browse cooks near me (map + list)
19. Filter: cuisine, availability ("available today" vs scheduled), price range
20. Cook profile + dish detail pages
21. Cart (single cook per order in v1)
22. Delivery time slot picker (respects cook lead time)
23. Stripe checkout + driver tip
24. **Home-kitchen disclosure + acknowledgment checkbox** at checkout
25. Order tracking (status timeline)
26. Order history + reorder

### Driver
27. Sign up + login (mobile-web optimized)
28. Verification: driver's license, auto insurance card, ID, 18+ age
29. **Background check** workflow (Checkr API or manual upload + admin approve)
30. Stripe Connect payout onboarding (collects W-9 automatically)
31. **Thermal bag acknowledgment at onboarding** — driver confirms they own an insulated food delivery bag (required for TCS orders; food safety)
32. Go online / offline toggle
33. Available jobs feed (transparent base pay + tip breakdown)
34. Claim a job (first-come-first-serve)
35. Pickup flow with photo confirmation
36. Dropoff flow with photo confirmation
37. Earnings dashboard
38. **Auto insurance expiry tracking** — auto-pause when lapsed
39. **Instant payout button** — driver can transfer earnings to bank immediately via Stripe Connect (not end-of-week batch)

### Admin (founder)
40. Cook approval queue
41. Driver approval queue
42. Order intervention: refund, reassign driver, force-cancel
43. Manual dispatch fallback (alert if no driver claims in N min)
44. User suspension (cook / buyer / driver)
45. Platform metrics: GMV, take rate, active users by role, completed orders
46. **DSHS registration status dashboard** — view which cooks have valid DSHS registration for TCS dishes

### Shared infrastructure
47. Stripe Connect 3-way split payments (buyer → platform + cook + driver)
48. Order state machine
49. Geo proximity (cook discovery + driver job feed)
50. Email notifications (Resend)
51. Photo upload + storage (Cloudflare R2 or S3)
52. Basic search (dishes, cooks, cuisine)
53. **Version-tracked ToS acknowledgments** (separate ToS for cook / buyer / driver)
54. Audit log of state transitions

## 5. Legal compliance baked into software

| Risk | Software handles | Outside software (founder handles) |
|---|---|---|
| Stripe shuts down account for unlicensed food prep | Mandatory TX food handler cert upload + expiry tracking creates documented safety program | — |
| Buyer gets sick + sues | Home-kitchen disclosure with "I acknowledge" checkbox at checkout; ToS waiver | LLC formation; General Liability + **Product Liability endorsement** (~$33–126/mo, The Hartford / Amwins) |
| Cook's food handler cert silently expires | Auto-disable cook's listings on expiry; email reminders at 30/14/7 days before | — |
| Driver crashes during delivery; personal auto insurance denies | Driver ToS disclaims commercial coverage; insurance proof tracked; rideshare endorsement recommended at onboarding | **Hired & Non-Owned Auto (HNOA) insurance** — covers platform when drivers use personal vehicles for delivery (Hudson Insurance / Amwins, up to $5M limit; ~$156–181/mo) |
| Driver injured on the job (1099, no Workers' Comp) | Driver ToS explains IC status + insurance responsibility | **Occupational Accident Insurance (OAI)** for 1099 drivers (~$32–91/mo) — covers work-related injuries; also a retention tool |
| Driver misclassification → accidental employee status | Drivers set hours, decline freely, no exclusivity/uniforms/scripts; platform does not provide equipment | Keep ToS aligned; do not prescribe hours/routes/tools (TX safe harbor under 40 T.A.C. § 815.134(b)) |
| Unsafe cook or driver | ID verification + background check + admin manual approval queue | — |
| Tax reporting (1099-NEC) for cooks + drivers | Stripe Connect collects W-9 at onboarding and issues 1099-NEC automatically | — |
| User claims they never agreed to terms | Version-tracked ToS — signed version + timestamp stored in DB | — |
| Food poisoning incident, no records | Permanent order history, cook cert status, disclosure acknowledgments retained | Liability insurance + Product Liability endorsement covers claims |
| **Cook lists prohibited food (meat, seafood, ice cream)** | **Prohibited item acknowledgment checkbox at dish creation; admin can flag/remove dishes** | Founder monitors for violations in early days |
| **Cook sells TCS food without DSHS registration** | **Gate TCS dish listings behind DSHS registration upload + admin approval** | — |
| **Cook exceeds $150K TX cottage food cap** | **Annual GMV warning emails at $125K and $145K; admin alert above $148K** | Cook must obtain Dallas Retail Food Establishment permit (fee tier based on gross sales) |
| **Driver delivers food in unsafe temperature** | **Thermal bag acknowledgment at driver onboarding; driver ToS covers food safety liability** | Consider subsidizing insulated bags (~$15–59 each) for first 20 drivers |
| **Food spoiled in transit (vehicle breakdown, delay)** | Order timestamp audit trail documents transit time | **Food Spoilage & Perishable Goods in Transit insurance** — covers value of ruined food |
| Data breach / customer PII exposed | — | **Cyber Insurance** (~$81–129/mo) — covers breach notification costs |

## 5b. Texas regulatory context (SB 541 — Food Freedom Act, effective Sept 1 2025)

Understanding which dish category a cook is selling determines what the software must enforce.

| Category | Examples | Software enforcement |
|---|---|---|
| **Non-TCS (shelf-stable)** | Baked goods (no custard/cream), candy, nuts, dry mixes, pickled produce pH ≤ 4.6, fruit butters | Standard labeling only; no registration needed; can list freely after cook approval |
| **TCS (refrigerated / prepared)** | Prepared meals, cheesecakes, cream pies, refrigerated desserts | Gate behind DSHS registration upload + admin approval before dishes go live |
| **Prohibited** | Meat/poultry, seafood, ice cream/gelato, low-acid canned goods, raw milk, CBD/THC | Hard block — cannot be listed; cook must acknowledge prohibition when creating any dish |

**Annual earnings cap:** SB 541 raised the TX cottage food gross income cap from $50K → $150K. Above $150K a cook needs a Dallas Retail Food Establishment Permit (fee tier by gross sales). The platform warns at $125K and $145K and alerts the admin at $148K.

**"Person-to-person" delivery:** TX law requires cottage food sold online to be delivered by the operator, their employee, or household member. A platform using gig drivers needs a legal architecture:
- **Non-TCS:** Platform qualifies as a "Cottage Food Vendor" (entity with contractual relationship with cook). Gig drivers can deliver.
- **TCS:** Law requires person-to-person handoff. Drivers are engaged as agents of the cook under a signed agency agreement (embedded in driver ToS). Legal counsel should review this before launch.

**Driver contractor safe harbor:** TX Workforce Commission provides a "Marketplace Platform" safe harbor (40 T.A.C. § 815.134(b)) classifying platform workers as independent contractors for unemployment tax purposes, provided the platform does not prescribe hours, does not restrict use of other apps, and does not furnish equipment.

**Dallas HB 2844 (effective July 1, 2026):** Mobile food unit operators in Dallas County may need an additional permit. Monitor for updates before launch.

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
  dshsRegistrationUrl, dshsRegistrationStatus   ← required if cook lists any TCS dish
  annualGmvCents                                 ← running total; triggers warning at $125K/$145K
  stripeConnectAccountId
  approvedAt, approvedBy

DriverProfile (1:1)
  userId
  licenseDocUrl, licenseExpiresAt
  insuranceDocUrl, insuranceExpiresAt
  thermalBagAcknowledged (bool)                  ← confirmed they own an insulated delivery bag
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
  dishCategory (NON_TCS | TCS)                   ← TX SB 541 compliance; TCS gates behind DSHS
  prohibitedItemsAcknowledged (bool)             ← cook confirmed no meat/seafood/ice cream

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
