import { prisma } from '@/lib/prisma';
import type { TosType } from '@prisma/client';

export const CURRENT_TOS_VERSIONS: Record<TosType, string> = {
  COOK: '2026-05-13-v1',
  BUYER: '2026-05-13-v1',
  DRIVER: '2026-05-13-v1',
};

export async function recordAcceptance(args: {
  userId: string;
  tosType: TosType;
  ipAddress?: string;
}) {
  return prisma.tosAcceptance.create({
    data: {
      userId: args.userId,
      tosType: args.tosType,
      version: CURRENT_TOS_VERSIONS[args.tosType],
      ipAddress: args.ipAddress,
    },
  });
}

export async function hasAcceptedCurrent(
  userId: string,
  tosType: TosType,
): Promise<boolean> {
  const row = await prisma.tosAcceptance.findFirst({
    where: {
      userId,
      tosType,
      version: CURRENT_TOS_VERSIONS[tosType],
    },
    orderBy: { acceptedAt: 'desc' },
  });
  return !!row;
}
