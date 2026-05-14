-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('COOK', 'BUYER', 'DRIVER', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('NOT_SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BackgroundCheckStatus" AS ENUM ('NOT_STARTED', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "OrderState" AS ENUM ('DRAFT', 'PLACED', 'COOK_ACCEPTED', 'COOK_DECLINED', 'PREPARING', 'READY_FOR_PICKUP', 'DRIVER_ASSIGNED', 'PICKED_UP', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "TosType" AS ENUM ('COOK', 'BUYER', 'DRIVER');

-- CreateEnum
CREATE TYPE "DishCategory" AS ENUM ('NON_TCS', 'TCS');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "name" TEXT,
    "phone" TEXT,
    "roles" "UserRole"[],
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "CookProfile" (
    "userId" TEXT NOT NULL,
    "photoUrl" TEXT,
    "story" TEXT,
    "cuisineTags" TEXT[],
    "neighborhood" TEXT,
    "addressLine" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "idDocUrl" TEXT,
    "idStatus" "VerificationStatus" NOT NULL DEFAULT 'NOT_SUBMITTED',
    "foodHandlerCertUrl" TEXT,
    "foodHandlerCertExpiresAt" TIMESTAMP(3),
    "foodHandlerCertStatus" "VerificationStatus" NOT NULL DEFAULT 'NOT_SUBMITTED',
    "dshsRegistrationUrl" TEXT,
    "dshsRegistrationStatus" "VerificationStatus" NOT NULL DEFAULT 'NOT_SUBMITTED',
    "annualGmvCents" INTEGER NOT NULL DEFAULT 0,
    "annualGmvYear" INTEGER NOT NULL DEFAULT 0,
    "stripeConnectAccountId" TEXT,
    "stripeOnboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" TIMESTAMP(3),
    "approvedByUserId" TEXT,
    "rejectedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CookProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Dish" (
    "id" TEXT NOT NULL,
    "cookId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "photoUrl" TEXT,
    "priceCents" INTEGER NOT NULL,
    "portionSize" TEXT,
    "allergens" TEXT[],
    "leadTimeHours" INTEGER NOT NULL DEFAULT 4,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "dishCategory" "DishCategory" NOT NULL DEFAULT 'NON_TCS',
    "prohibitedItemsAcknowledged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dish_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CookAvailability" (
    "id" TEXT NOT NULL,
    "cookId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "orderCutoffMinutes" INTEGER NOT NULL DEFAULT 60,
    "maxOrdersPerDay" INTEGER NOT NULL DEFAULT 10,

    CONSTRAINT "CookAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuyerProfile" (
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuyerProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "BuyerAddress" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "BuyerAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverProfile" (
    "userId" TEXT NOT NULL,
    "licenseDocUrl" TEXT,
    "licenseExpiresAt" TIMESTAMP(3),
    "insuranceDocUrl" TEXT,
    "insuranceExpiresAt" TIMESTAMP(3),
    "carPhotoUrl" TEXT,
    "idDocUrl" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "docsStatus" "VerificationStatus" NOT NULL DEFAULT 'NOT_SUBMITTED',
    "backgroundCheckStatus" "BackgroundCheckStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "backgroundCheckCompletedAt" TIMESTAMP(3),
    "stripeConnectAccountId" TEXT,
    "stripeOnboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "thermalBagAcknowledged" BOOLEAN NOT NULL DEFAULT false,
    "thermalBagPhotoUrl" TEXT,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "currentLat" DOUBLE PRECISION,
    "currentLng" DOUBLE PRECISION,
    "approvedAt" TIMESTAMP(3),
    "approvedByUserId" TEXT,
    "rejectedReason" TEXT,

    CONSTRAINT "DriverProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "cookId" TEXT NOT NULL,
    "driverId" TEXT,
    "state" "OrderState" NOT NULL DEFAULT 'DRAFT',
    "subtotalCents" INTEGER NOT NULL,
    "cookCommissionCents" INTEGER NOT NULL,
    "buyerServiceFeeCents" INTEGER NOT NULL,
    "deliveryFeeCents" INTEGER NOT NULL,
    "driverBasePayCents" INTEGER NOT NULL,
    "driverTipCents" INTEGER NOT NULL DEFAULT 0,
    "totalChargedCents" INTEGER NOT NULL,
    "cookPayoutCents" INTEGER NOT NULL,
    "driverPayoutCents" INTEGER NOT NULL,
    "platformRevenueCents" INTEGER NOT NULL,
    "pickupAddressLine" TEXT NOT NULL,
    "pickupLat" DOUBLE PRECISION NOT NULL,
    "pickupLng" DOUBLE PRECISION NOT NULL,
    "deliveryAddressLine" TEXT NOT NULL,
    "deliveryLat" DOUBLE PRECISION NOT NULL,
    "deliveryLng" DOUBLE PRECISION NOT NULL,
    "distanceMiles" DOUBLE PRECISION NOT NULL,
    "requestedDeliveryAt" TIMESTAMP(3) NOT NULL,
    "placedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "preparingAt" TIMESTAMP(3),
    "readyAt" TIMESTAMP(3),
    "pickedUpAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "homeKitchenDisclosureAccepted" BOOLEAN NOT NULL,
    "homeKitchenDisclosureAcceptedAt" TIMESTAMP(3) NOT NULL,
    "cookCertSnapshotExpiresAt" TIMESTAMP(3) NOT NULL,
    "containsTcsItems" BOOLEAN NOT NULL DEFAULT false,
    "stripePaymentIntentId" TEXT,
    "stripeChargeId" TEXT,
    "buyerNote" TEXT,
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "dishId" TEXT NOT NULL,
    "dishNameSnapshot" TEXT NOT NULL,
    "unitPriceCents" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderEvent" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "fromState" "OrderState",
    "toState" "OrderState" NOT NULL,
    "actorUserId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TosAcceptance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tosType" "TosType" NOT NULL,
    "version" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,

    CONSTRAINT "TosAcceptance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "Dish_cookId_isActive_idx" ON "Dish"("cookId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "CookAvailability_cookId_dayOfWeek_key" ON "CookAvailability"("cookId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "Order_state_idx" ON "Order"("state");

-- CreateIndex
CREATE INDEX "Order_cookId_state_idx" ON "Order"("cookId", "state");

-- CreateIndex
CREATE INDEX "Order_driverId_state_idx" ON "Order"("driverId", "state");

-- CreateIndex
CREATE INDEX "Order_buyerId_createdAt_idx" ON "Order"("buyerId", "createdAt");

-- CreateIndex
CREATE INDEX "OrderEvent_orderId_createdAt_idx" ON "OrderEvent"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "TosAcceptance_userId_tosType_idx" ON "TosAcceptance"("userId", "tosType");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CookProfile" ADD CONSTRAINT "CookProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dish" ADD CONSTRAINT "Dish_cookId_fkey" FOREIGN KEY ("cookId") REFERENCES "CookProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CookAvailability" ADD CONSTRAINT "CookAvailability_cookId_fkey" FOREIGN KEY ("cookId") REFERENCES "CookProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyerProfile" ADD CONSTRAINT "BuyerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyerAddress" ADD CONSTRAINT "BuyerAddress_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "BuyerProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverProfile" ADD CONSTRAINT "DriverProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_cookId_fkey" FOREIGN KEY ("cookId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "Dish"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderEvent" ADD CONSTRAINT "OrderEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TosAcceptance" ADD CONSTRAINT "TosAcceptance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
