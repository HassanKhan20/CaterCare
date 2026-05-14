import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1 admin
  await prisma.user.upsert({
    where: { email: 'admin@catercare.test' },
    update: {},
    create: {
      email: 'admin@catercare.test',
      name: 'Admin',
      roles: ['ADMIN'],
      status: 'ACTIVE',
    },
  });

  // 3 approved cooks
  const cuisines = [['Pakistani'], ['Mexican'], ['Ethiopian']];
  const stories = [
    'I learned biryani from my grandmother in Karachi.',
    'Family recipes from Oaxaca — passed down three generations.',
    'Authentic Ethiopian injera + wat, just like home.',
  ];
  for (let i = 1; i <= 3; i++) {
    const email = `cook${i}@catercare.test`;
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: `Cook ${i}`,
        roles: ['COOK'],
        status: 'ACTIVE',
        cookProfile: {
          create: {
            story: stories[i - 1] ?? 'Sample cook',
            cuisineTags: cuisines[i - 1] ?? ['Other'],
            neighborhood: 'Plano',
            lat: 33.0738 + i * 0.01,
            lng: -96.7480 + i * 0.01,
            addressLine: `Plano, TX cook ${i}`,
            idStatus: 'APPROVED',
            foodHandlerCertStatus: 'APPROVED',
            foodHandlerCertExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            dshsRegistrationStatus: 'APPROVED',
            stripeOnboardingComplete: true,
            stripeConnectAccountId: `acct_seed_cook_${i}`,
            approvedAt: new Date(),
            annualGmvCents: 0,
            annualGmvYear: new Date().getFullYear(),
            dishes: {
              create: [
                {
                  name: `Cook ${i} Special`,
                  description: 'Hot prepared meal made fresh today.',
                  priceCents: 1500,
                  allergens: ['nuts'],
                  leadTimeHours: 4,
                  dishCategory: 'TCS',
                  prohibitedItemsAcknowledged: true,
                  photoUrl: 'https://placehold.co/600x400',
                },
                {
                  name: `Cook ${i} Dessert`,
                  description: 'Shelf-stable sweet treat.',
                  priceCents: 600,
                  allergens: [],
                  leadTimeHours: 4,
                  dishCategory: 'NON_TCS',
                  prohibitedItemsAcknowledged: true,
                  photoUrl: 'https://placehold.co/600x400',
                },
              ],
            },
          },
        },
      },
    });
  }

  // 5 approved drivers
  for (let i = 1; i <= 5; i++) {
    const email = `driver${i}@catercare.test`;
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: `Driver ${i}`,
        roles: ['DRIVER'],
        status: 'ACTIVE',
        driverProfile: {
          create: {
            docsStatus: 'APPROVED',
            backgroundCheckStatus: 'APPROVED',
            backgroundCheckCompletedAt: new Date(),
            stripeOnboardingComplete: true,
            stripeConnectAccountId: `acct_seed_driver_${i}`,
            thermalBagAcknowledged: true,
            licenseExpiresAt: new Date(Date.now() + 365 * 86400_000),
            insuranceExpiresAt: new Date(Date.now() + 180 * 86400_000),
            dateOfBirth: new Date('1990-01-01'),
            isOnline: false,
            currentLat: 33.0738,
            currentLng: -96.7480,
            approvedAt: new Date(),
          },
        },
      },
    });
  }

  // 3 buyers with addresses
  for (let i = 1; i <= 3; i++) {
    const email = `buyer${i}@catercare.test`;
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: `Buyer ${i}`,
        roles: ['BUYER'],
        status: 'ACTIVE',
        buyerProfile: {
          create: {
            addresses: {
              create: [
                {
                  label: 'Home',
                  line1: `${1000 + i} Main St`,
                  city: 'Plano',
                  state: 'TX',
                  zip: '75024',
                  lat: 33.0800 + i * 0.005,
                  lng: -96.7500 + i * 0.005,
                  isDefault: true,
                },
              ],
            },
          },
        },
      },
    });
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
