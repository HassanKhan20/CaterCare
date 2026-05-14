export default function OrdersLoading() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-40 bg-slate-200 rounded-lg" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="h-4 w-36 bg-slate-200 rounded" />
                  <div className="h-3 w-24 bg-slate-200 rounded" />
                  <div className="h-5 w-20 bg-slate-200 rounded-full" />
                </div>
                <div className="h-5 w-16 bg-slate-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
