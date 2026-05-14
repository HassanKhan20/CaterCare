import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail, templates } from '@/lib/email';
import { isProhibitedKeyword } from '@/lib/cottage-food';
import { z } from 'zod';

const Body = z.object({
  name: z.string().min(2).max(80),
  description: z.string().min(10).max(1000),
  photoUrl: z.string().url(),
  priceCents: z.number().int().min(100).max(50000),
  portionSize: z.string().optional(),
  allergens: z.array(z.string()),
  leadTimeHours: z.number().int().min(0).max(168),
  // TX SB 541 fields — required
  dishCategory: z.enum(['NON_TCS', 'TCS']),
  prohibitedItemsAcknowledged: z.literal(true),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const profile = await prisma.cookProfile.findUnique({
    where: { userId: session.user.id },
    include: { user: true },
  });
  if (!profile?.approvedAt) return NextResponse.json({ error: 'NOT_APPROVED' }, { status: 403 });
  const body = Body.parse(await req.json());

  // TX SB 541: TCS dishes require DSHS registration to be active.
  // Create-but-deactivate: dish auto-reactivates when admin approves DSHS (A.9b).
  const tcsBlocked = body.dishCategory === 'TCS' && profile.dshsRegistrationStatus !== 'APPROVED';

  // Prohibited-keyword check is ADVISORY only — the cook's acknowledgment is the primary defense.
  // Flag for admin review because keyword matching has false positives (e.g. "chicken-style tofu").
  const flaggedForReview =
    isProhibitedKeyword(body.name) || isProhibitedKeyword(body.description);

  const dish = await prisma.dish.create({
    data: { cookId: session.user.id, ...body, isActive: !tcsBlocked },
  });

  if (tcsBlocked) {
    const t = templates.dshsRegistrationRequired(profile.user.name ?? 'Cook');
    await sendEmail({ to: profile.user.email, subject: t.subject, html: t.html });
  }

  if (flaggedForReview) {
    const admin = await prisma.user.findFirst({ where: { roles: { has: 'ADMIN' } } });
    if (admin) {
      const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
      await sendEmail({
        to: admin.email,
        subject: `Review dish "${body.name}" — prohibited-keyword match`,
        html: `<p>Cook ${profile.user.name} (${profile.user.email}) created a dish with a prohibited-keyword match. Likely false positive but please review.</p>
               <p><a href="${appUrl}/admin/cooks/${session.user.id}">Open cook</a></p>`,
      });
    }
  }

  return NextResponse.json({
    dish,
    warning: tcsBlocked ? 'TCS_REQUIRES_DSHS' : undefined,
    flaggedForReview,
  });
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const dishes = await prisma.dish.findMany({
    where: { cookId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ dishes });
}
