export default function CookDashboardLoading() {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white h-14" />
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded-lg" />
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <div className="h-4 w-36 bg-slate-200 rounded" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-slate-200" />
                <div className="h-4 w-40 bg-slate-200 rounded" />
              </div>
              <div className="h-4 w-16 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-2">
          <div className="h-4 w-48 bg-slate-200 rounded" />
          <div className="h-10 w-32 bg-slate-200 rounded" />
        </div>
      </div>
    </main>
  );
}
