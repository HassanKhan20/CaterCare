export default function OrderDetailLoading() {
  return (
    <main className="cc-page cc-page-narrow">
      <Skel width={120} height={14} />
      <div style={{ marginTop: 24 }}>
        <Skel width="60%" height={56} />
      </div>
      <div style={{ marginTop: 32 }}>
        <Skel width={220} height={36} />
      </div>
      <div style={{ marginTop: 32 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ marginBottom: 24 }}>
            <Skel width={180} height={14} />
            <div style={{ marginTop: 8 }}>
              <Skel width={110} height={11} />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

function Skel({ width, height }: { width?: number | string; height?: number | string }) {
  return (
    <div
      style={{
        width: width ?? '100%',
        height,
        background: 'var(--bg-soft)',
        borderRadius: 4,
        animation: 'cc-pulse 1.6s ease-in-out infinite',
      }}
    />
  );
}
