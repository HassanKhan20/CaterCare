import NextAuth, { type DefaultSession } from 'next-auth';
import Google from 'next-auth/providers/google';
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
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
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
