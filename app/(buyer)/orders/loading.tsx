export default function OrdersLoading() {
  return (
    <main className="cc-page cc-page-narrow">
      <Skel width={220} height={48} />
      <div style={{ marginTop: 12 }}>
        <Skel width={320} height={14} />
      </div>
      <div style={{ marginTop: 32 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '28px 0',
              borderBottom: '1px solid var(--line)',
            }}
          >
            <div style={{ flex: 1 }}>
              <Skel width={180} height={11} />
              <div style={{ marginTop: 12 }}>
                <Skel width="40%" height={26} />
              </div>
              <div style={{ marginTop: 12 }}>
                <Skel width={80} height={18} />
              </div>
            </div>
            <Skel width={70} height={26} />
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
