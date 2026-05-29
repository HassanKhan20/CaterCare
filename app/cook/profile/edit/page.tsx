'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';

type Profile = {
  photoUrl: string | null;
  story: string | null;
  cuisineTags: string[];
  neighborhood: string | null;
};

export default function CookProfileEditPage() {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [story, setStory] = useState('');
  const [cuisineTagsInput, setCuisineTagsInput] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/cook/profile');
      if (res.ok) {
        const { profile } = (await res.json()) as { profile: Profile | null };
        if (profile) {
          setStory(profile.story ?? '');
          setCuisineTagsInput(profile.cuisineTags.join(', '));
          setNeighborhood(profile.neighborhood ?? '');
          setExistingPhotoUrl(profile.photoUrl ?? null);
        }
      }
      setLoaded(true);
    };
    queueMicrotask(load);
  }, []);

  const onPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setPhotoFile(file);
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
  };

  const submit = async () => {
    const cuisineTags = cuisineTagsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (story.length < 10 || cuisineTags.length === 0 || !neighborhood) {
      setError('Please fill story, at least one cuisine, and your neighborhood.');
      return;
    }
    setSubmitting(true);
    setError(null);
    setSaved(false);
    try {
      let photoUrl: string | undefined = existingPhotoUrl ?? undefined;
      if (photoFile) {
        const presignRes = await fetch('/api/uploads/presign', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ purpose: 'cook-profile', contentType: photoFile.type }),
        });
        if (!presignRes.ok) throw new Error('Could not upload your photo. Please try again.');
        const { uploadUrl, publicUrl } = await presignRes.json();
        const up = await fetch(uploadUrl, {
          method: 'PUT',
          body: photoFile,
          headers: { 'content-type': photoFile.type },
        });
        if (!up.ok) throw new Error('Could not upload your photo. Please try again.');
        photoUrl = publicUrl;
      }
      const res = await fetch('/api/cook/profile', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ story, cuisineTags, neighborhood, photoUrl }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? 'Failed to save.');
        return;
      }
      setExistingPhotoUrl(photoUrl ?? null);
      setPhotoFile(null);
      setPhotoPreview(null);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!loaded) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--color-surface-0)]">
        <Spinner className="w-8 h-8" />
      </main>
    );
  }

  const shownPhoto = photoPreview ?? existingPhotoUrl;

  return (
    <main className="min-h-screen bg-[var(--color-surface-0)]">
      <header className="border-b bg-[var(--color-surface-1)]">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Link
            href="/cook"
            className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            ← Dashboard
          </Link>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Edit your profile</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            This is what buyers see on your cook page.
          </p>
        </div>

        <Card className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Profile photo</label>
            <div className="flex items-center gap-4">
              {shownPhoto && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={shownPhoto}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover"
                />
              )}
              <input type="file" accept="image/*" onChange={onPhotoChange} className="text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Your story</label>
            <textarea
              value={story}
              onChange={(e) => setStory(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-[var(--color-surface-3)]"
              rows={5}
              placeholder="I learned to cook from my grandmother in Karachi…"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Cuisines (comma-separated)</label>
            <Input
              value={cuisineTagsInput}
              onChange={(e) => setCuisineTagsInput(e.target.value)}
              placeholder="Pakistani, Indian"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Neighborhood</label>
            <Input
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              placeholder="Plano"
            />
          </div>
        </Card>

        {error && <p className="text-sm text-red-700">{error}</p>}
        {saved && <p className="text-sm text-emerald-700">Saved. Your profile is updated.</p>}

        <div className="flex gap-3">
          <Button className="flex-1" onClick={submit} disabled={submitting}>
            {submitting ? 'Saving…' : 'Save changes'}
          </Button>
          <Button variant="secondary" onClick={() => router.push('/cook')} disabled={submitting}>
            Done
          </Button>
        </div>
      </div>
    </main>
  );
}
