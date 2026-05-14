import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { env } from '@/lib/env';

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  if (!q) return NextResponse.json({ error: 'Missing q' }, { status: 400 });

  const url = new URL('https://api.mapbox.com/geocoding/v5/mapbox.places/' + encodeURIComponent(q) + '.json');
  url.searchParams.set('access_token', env.MAPBOX_TOKEN);
  url.searchParams.set('country', 'US');
  url.searchParams.set('types', 'address');
  url.searchParams.set('limit', '1');

  const res = await fetch(url.toString(), { next: { revalidate: 60 } });
  if (!res.ok) return NextResponse.json({ error: 'GEOCODE_FAILED' }, { status: 502 });

  const json = await res.json();
  const feature = json.features?.[0];
  if (!feature) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

  const [lng, lat] = feature.center as [number, number];
  return NextResponse.json({ lat, lng });
}
