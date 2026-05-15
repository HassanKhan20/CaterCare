export default function BrowseLoading() {
  return (
    <main className="cc-page">
      <section className="cc-hero">
        <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
          <Skeleton width={180} height={28} pill />
          <Skeleton width={140} height={28} pill />
        </div>
        <Skeleton height={84} width="80%" />
        <div style={{ marginTop: 56, display: 'flex', gap: 24 }}>
          <Skeleton width={100} height={48} />
          <Skeleton width={100} height={48} />
          <Skeleton width={100} height={48} />
        </div>
      </section>
      <section className="cc-section">
        <div className="cc-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <Skeleton aspect="5 / 4" radius={4} />
              <div style={{ marginTop: 16 }}>
                <Skeleton width={80} height={11} />
                <div style={{ marginTop: 8 }}>
                  <Skeleton width="70%" height={24} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function Skeleton({
  width,
  height,
  aspect,
  radius = 4,
  pill,
}: {
  width?: number | string;
  height?: number | string;
  aspect?: string;
  radius?: number;
  pill?: boolean;
}) {
  return (
    <div
      style={{
        width: width ?? '100%',
        height,
        aspectRatio: aspect,
        background: 'var(--bg-soft)',
        borderRadius: pill ? 999 : radius,
        animation: 'cc-pulse 1.6s ease-in-out infinite',
      }}
    />
  );
}
