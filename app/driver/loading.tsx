export default function DriverDashboardLoading() {
  return (
    <main className="min-h-screen bg-[var(--color-surface-0)]">
      <header className="border-b border-[var(--color-surface-3)] bg-[var(--color-surface-1)] h-14" />
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-[var(--color-surface-2)] rounded-lg" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-[var(--color-surface-3)] bg-[var(--color-surface-1)] p-6 space-y-2">
              <div className="h-3 w-24 bg-[var(--color-surface-2)] rounded" />
              <div className="h-8 w-16 bg-[var(--color-surface-2)] rounded" />
            </div>
          ))}
        </div>
        <div className="h-12 w-full bg-[var(--color-surface-2)] rounded-lg" />
      </div>
    </main>
  );
}
