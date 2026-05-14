import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { haversineMiles } from '@/lib/geo';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const lat = parseFloat(url.searchParams.get('lat') ?? '');
  const lng = parseFloat(url.searchParams.get('lng') ?? '');
  const radius = parseFloat(url.searchParams.get('radius') ?? '10');
  const cuisine = url.searchParams.get('cuisine');

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json({ error: 'BAD_LATLNG' }, { status: 400 });
  }

  const cooks = await prisma.cookProfile.findMany({
    where: {
      approvedAt: { not: null },
      foodHandlerCertStatus: 'APPROVED',
      user: { status: 'ACTIVE' },
      ...(cuisine ? { cuisineTags: { has: cuisine } } : {}),
      lat: { not: null },
      lng: { not: null },
    },
    include: {
      user: { select: { name: true } },
      dishes: { where: { isActive: true } },
    },
  });

  const filtered = cooks
    .filter((c) => haversineMiles({ lat, lng }, { lat: c.lat!, lng: c.lng! }) <= radius)
    .map((c) => ({
      id: c.userId,
      name: c.user.name,
      photoUrl: c.photoUrl,
      story: c.story,
      cuisineTags: c.cuisineTags,
      neighborhood: c.neighborhood,
      distanceMiles: haversineMiles({ lat, lng }, { lat: c.lat!, lng: c.lng! }),
      dishCount: c.dishes.length,
    }))
    .sort((a, b) => a.distanceMiles - b.distanceMiles);

  return NextResponse.json({ cooks: filtered });
}
