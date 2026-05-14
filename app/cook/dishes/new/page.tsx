'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

const COMMON_ALLERGENS = ['nuts', 'peanuts', 'dairy', 'eggs', 'gluten', 'soy', 'shellfish'];

export default function NewDishPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceDollars, setPriceDollars] = useState('15.00');
  const [portionSize, setPortionSize] = useState('');
  const [leadTimeHours, setLeadTimeHours] = useState('4');
  const [allergens, setAllergens] = useState<string[]>([]);
  const [dishCategory, setDishCategory] = useState<'NON_TCS' | 'TCS'>('NON_TCS');
  const [prohibitedAck, setProhibitedAck] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const toggleAllergen = (a: string) =>
    setAllergens((cur) => (cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a]));

  const submit = async () => {
    if (!photoFile) {
      setError('Please add a photo.');
      return;
    }
    if (!prohibitedAck) {
      setError('You must acknowledge the prohibited items list.');
      return;
    }
    setSubmitting(true);
    setError(null);
    setWarning(null);
    try {
      const presignRes = await fetch('/api/uploads/presign', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ purpose: 'dish', contentType: photoFile.type }),
      });
      const { uploadUrl, publicUrl } = await presignRes.json();
      await fetch(uploadUrl, {
        method: 'PUT',
        body: photoFile,
        headers: { 'content-type': photoFile.type },
      });

      const res = await fetch('/api/cook/dishes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          photoUrl: publicUrl,
          priceCents: Math.round(parseFloat(priceDollars) * 100),
          portionSize: portionSize || undefined,
          allergens,
          leadTimeHours: parseInt(leadTimeHours, 10),
          dishCategory,
          prohibitedItemsAcknowledged: true,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Failed.');
        return;
      }
      if (json.warning === 'TCS_REQUIRES_DSHS') {
        setWarning(
          'Dish saved but inactive — TCS dishes require DSHS registration approval.',
        );
        setTimeout(() => router.push('/cook/profile/dshs'), 2000);
      } else {
        router.push('/cook/dishes');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/cook/dishes" className="text-sm text-slate-600 hover:text-slate-900">
            ← Dishes
          </Link>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-3xl font-bold">New dish</h1>

        <Card className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
              className="text-sm"
            />
            {photoFile && <p className="text-xs text-slate-500 mt-1">{photoFile.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-slate-300"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Price ($)</label>
              <Input
                type="number"
                step="0.01"
                value={priceDollars}
                onChange={(e) => setPriceDollars(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Portion</label>
              <Input
                value={portionSize}
                onChange={(e) => setPortionSize(e.target.value)}
                placeholder="1 serving"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Lead time (h)</label>
              <Input
                type="number"
                value={leadTimeHours}
                onChange={(e) => setLeadTimeHours(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Allergens</label>
            <div className="flex flex-wrap gap-2">
              {COMMON_ALLERGENS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAllergen(a)}
                  className={`px-3 py-1 rounded-full text-xs border ${
                    allergens.includes(a)
                      ? 'bg-amber-100 border-amber-400 text-amber-900'
                      : 'bg-white border-slate-300 text-slate-600'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={dishCategory}
              onChange={(e) => setDishCategory(e.target.value as 'NON_TCS' | 'TCS')}
              className="w-full px-3 py-2 rounded-md border border-slate-300"
            >
              <option value="NON_TCS">Non-TCS (shelf-stable: baked goods, jams, dry mixes)</option>
              <option value="TCS">TCS (refrigerated / prepared meal — requires DSHS registration)</option>
            </select>
          </div>
        </Card>

        <Card className="bg-amber-50 border-amber-200">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={prohibitedAck}
              onChange={(e) => setProhibitedAck(e.target.checked)}
              className="mt-1"
            />
            <span className="text-sm">
              <strong className="block mb-1">I confirm this dish contains NONE of the following:</strong>
              meat, poultry, seafood, shellfish, ice cream, gelato, raw milk, low-acid canned
              goods, or CBD/THC. (TX SB 541 prohibited items.)
            </span>
          </label>
        </Card>

        {error && <p className="text-sm text-red-700">{error}</p>}
        {warning && <p className="text-sm text-amber-700">{warning}</p>}

        <Button className="w-full" onClick={submit} disabled={submitting}>
          {submitting ? 'Saving…' : 'Save dish'}
        </Button>
      </div>
    </main>
  );
}
