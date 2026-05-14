'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

export default function CookOnboardingPage() {
  const router = useRouter();
  const [story, setStory] = useState('');
  const [cuisineTagsInput, setCuisineTagsInput] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const cuisineTags = cuisineTagsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (story.length < 10 || cuisineTags.length === 0 || !neighborhood) {
      setError('Please fill all fields.');
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await fetch('/api/cook/profile', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ story, cuisineTags, neighborhood }),
    });
    if (!res.ok) {
      const j = await res.json();
      setError(j.error ?? 'Failed.');
      setSubmitting(false);
      return;
    }
    router.push('/cook/profile/id');
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/" className="text-xl font-bold text-brand-700">
            CaterCare
          </Link>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-3xl font-bold">Become a cook</h1>
        <p className="text-slate-600">
          Share your story. Buyers see this on your profile.
        </p>

        <Card className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Your story</label>
            <textarea
              value={story}
              onChange={(e) => setStory(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-slate-300"
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

        <Button className="w-full" onClick={submit} disabled={submitting}>
          {submitting ? '…' : 'Continue to ID verification'}
        </Button>
      </div>
    </main>
  );
}
