export default function DriverDashboardLoading() {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white h-14" />
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded-lg" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white p-6 space-y-2">
              <div className="h-3 w-24 bg-slate-200 rounded" />
              <div className="h-8 w-16 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
        <div className="h-12 w-full bg-slate-200 rounded-lg" />
      </div>
    </main>
  );
}
