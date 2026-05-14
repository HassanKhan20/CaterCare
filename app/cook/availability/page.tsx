'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type Slot = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  orderCutoffMinutes: number;
  maxOrdersPerDay: number;
  enabled: boolean;
};

const blank = (): Slot[] =>
  DAYS.map((_, i) => ({
    dayOfWeek: i,
    startTime: '09:00',
    endTime: '20:00',
    orderCutoffMinutes: 60,
    maxOrdersPerDay: 10,
    enabled: false,
  }));

export default function CookAvailabilityPage() {
  const [slots, setSlots] = useState<Slot[]>(blank());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/cook/availability')
      .then((r) => r.json())
      .then((j) => {
        const base = blank();
        for (const s of j.slots ?? []) {
          base[s.dayOfWeek] = { ...s, enabled: true };
        }
        setSlots(base);
      });
  }, []);

  const update = (i: number, patch: Partial<Slot>) => {
    setSlots((cur) => cur.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  };

  const save = async () => {
    setSaving(true);
    await fetch('/api/cook/availability', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        slots: slots
          .filter((s) => s.enabled)
          .map(({ enabled, ...rest }) => {
            void enabled;
            return rest;
          }),
      }),
    });
    setSaving(false);
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/cook" className="text-sm text-slate-600 hover:text-slate-900">
            ← Dashboard
          </Link>
        </div>
      </header>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-3xl font-bold">Weekly availability</h1>
        <p className="text-slate-600 text-sm">
          Set the days and hours you accept orders. Disabled days won&apos;t show up in buyer browse.
        </p>

        <Card className="space-y-3">
          {slots.map((s, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center text-sm">
              <label className="col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={s.enabled}
                  onChange={(e) => update(i, { enabled: e.target.checked })}
                />
                {DAYS[i]}
              </label>
              <div className="col-span-3">
                <Input
                  type="time"
                  value={s.startTime}
                  onChange={(e) => update(i, { startTime: e.target.value })}
                  disabled={!s.enabled}
                />
              </div>
              <div className="col-span-3">
                <Input
                  type="time"
                  value={s.endTime}
                  onChange={(e) => update(i, { endTime: e.target.value })}
                  disabled={!s.enabled}
                />
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  value={s.maxOrdersPerDay}
                  onChange={(e) => update(i, { maxOrdersPerDay: parseInt(e.target.value, 10) })}
                  disabled={!s.enabled}
                  title="Max orders/day"
                />
              </div>
              <div className="col-span-2 text-xs text-slate-500">max/day</div>
            </div>
          ))}
        </Card>

        <Button onClick={save} disabled={saving} className="w-full">
          {saving ? 'Saving…' : 'Save availability'}
        </Button>
      </div>
    </main>
  );
}
