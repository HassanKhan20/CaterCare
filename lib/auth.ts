import NextAuth, { type DefaultSession } from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
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
  interface User {
    roles?: UserRole[];
    status?: UserStatus;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string;
    roles?: UserRole[];
    status?: UserStatus;
  }
}

const isDev = process.env.NODE_ENV === 'development';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // JWT strategy required for Credentials provider + works in Edge middleware
  session: { strategy: 'jwt' },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
    // DEV-ONLY: accepts a seeded user email and logs you in without OAuth.
    // Guarded by NODE_ENV check + the email must exist in the DB.
    ...(isDev
      ? [
          Credentials({
            id: 'dev-credentials',
            name: 'Dev shortcut',
            credentials: { email: { label: 'Email', type: 'email' } },
            async authorize(creds) {
              if (process.env.NODE_ENV !== 'development') return null;
              const email = (creds?.email as string | undefined)?.trim();
              if (!email) return null;
              const user = await prisma.user.findUnique({ where: { email } });
              if (!user) return null;
              return {
                id: user.id,
                email: user.email,
                name: user.name,
                roles: user.roles,
                status: user.status,
              };
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    // The JWT callback runs in Edge runtime too (used by middleware), so it MUST
    // NOT call Prisma. Roles/status are captured at sign-in and refreshed only
    // when the user signs in again. Route handlers running in Node can use
    // `requireRole` to re-check against the DB for immediate suspension effect.
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.roles = user.roles ?? [];
        token.status = user.status ?? 'PENDING';
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId && session.user) {
        session.user.id = token.userId;
        session.user.roles = token.roles ?? [];
        session.user.status = token.status ?? 'PENDING';
      }
      return session;
    },
  },
  pages: { signIn: '/signin' },
});

export class UnauthorizedError extends Error {
  constructor() {
    super('UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export async function requireRole(role: UserRole) {
  const session = await auth();
  if (!session?.user || !session.user.roles.includes(role)) {
    throw new UnauthorizedError();
  }
  return session.user;
}
