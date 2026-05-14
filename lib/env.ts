import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(16),
  NEXTAUTH_URL: z.string().url(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
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
  COTTAGE_CAP_GMV_CENTS: z.coerce.number().int().positive(),
  CRON_SECRET: z.string().min(16),
});

export const env = schema.parse(process.env);
