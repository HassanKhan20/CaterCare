export default function OrderDetailLoading() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 animate-pulse">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-slate-200 rounded-lg" />
          <div className="h-5 w-28 bg-slate-200 rounded-full" />
        </div>
        {/* Timeline skeleton */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <div className="h-4 w-20 bg-slate-200 rounded" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full bg-slate-200 mt-1 shrink-0" />
              <div className="space-y-1 flex-1">
                <div className="h-4 w-40 bg-slate-200 rounded" />
                <div className="h-3 w-24 bg-slate-200 rounded" />
              </div>
            </div>
          ))}
        </div>
        {/* Items skeleton */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-3">
          <div className="h-4 w-16 bg-slate-200 rounded" />
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="h-4 w-40 bg-slate-200 rounded" />
              <div className="h-4 w-16 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
