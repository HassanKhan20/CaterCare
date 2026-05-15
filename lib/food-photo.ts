// Deterministic photo placeholder helper. When a cook/dish has no uploaded
// photo we hash the id to a stable Unsplash food image so each entity gets
// a different but predictable picture (no SSR/CSR mismatch).

const PHOTOS = [
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=900&q=80', // pizza
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=900&q=80',   // salad bowl
  'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=900&q=80', // biryani
  'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=900&q=80', // tacos
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=900&q=80', // pancakes
  'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=900&q=80',   // burger
  'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=900&q=80', // shawarma
  'https://images.unsplash.com/photo-1606728035253-49e8a23146de?w=900&q=80', // injera
];

function hash(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function photoFor(id: string, override?: string | null): string {
  if (override && !override.includes('placehold.co')) return override;
  return PHOTOS[hash(id) % PHOTOS.length];
}
