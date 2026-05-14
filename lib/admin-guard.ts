import { NextResponse } from 'next/server';
import { requireRole, UnauthorizedError } from '@/lib/auth';

type AdminUser = Awaited<ReturnType<typeof requireRole>>;

export function adminGuard<TArgs extends unknown[]>(
  handler: (admin: AdminUser, ...args: TArgs) => Promise<Response>,
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
