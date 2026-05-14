import { NextResponse } from 'next/server';
import { requireRole, UnauthorizedError } from '@/lib/auth';

/**
 * Wraps an admin route handler so all the UNAUTHORIZED plumbing lives in one place.
 * The handler receives the authenticated admin user as its first argument, followed
 * by whatever Next.js passes (e.g. params).
 */
export function adminGuard<TArgs extends unknown[]>(
  handler: (admin: { id: string; email?: string | null }, ...args: TArgs) => Promise<Response>,
) {
  return async (...args: TArgs): Promise<Response> => {
    try {
      const admin = await requireRole('ADMIN');
      return await handler(admin, ...args);
    } catch (e) {
      if (e instanceof UnauthorizedError) {
        return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
      }
      throw e;
    }
  };
}
