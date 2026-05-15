export default function AdminLoading() {
  return (
    <main className="min-h-screen bg-[var(--color-surface-0)]">
      <header className="border-b border-[var(--color-surface-3)] bg-[var(--color-surface-1)] h-14" />
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 animate-pulse">
        <div className="h-8 w-36 bg-[var(--color-surface-2)] rounded-lg" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-[var(--color-surface-3)] bg-[var(--color-surface-1)] p-6 space-y-2">
              <div className="h-3 w-20 bg-[var(--color-surface-2)] rounded" />
              <div className="h-9 w-12 bg-[var(--color-surface-2)] rounded" />
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-[var(--color-surface-3)] bg-[var(--color-surface-1)] p-6 space-y-4">
          <div className="h-4 w-24 bg-[var(--color-surface-2)] rounded" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-28 bg-[var(--color-surface-2)] rounded" />
                <div className="h-8 w-24 bg-[var(--color-surface-2)] rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
