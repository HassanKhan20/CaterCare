export default function CookPageLoading() {
  return (
    <main className="cc-page">
      <div style={{ paddingTop: 32 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 48,
            paddingTop: 32,
            paddingBottom: 48,
            borderBottom: '1px solid var(--line)',
          }}
        >
          <div>
            <Skel width={140} height={11} />
            <div style={{ marginTop: 16 }}>
              <Skel height={80} />
            </div>
            <div style={{ marginTop: 24 }}>
              <Skel width="80%" height={18} />
              <div style={{ marginTop: 12 }}>
                <Skel width="60%" height={18} />
              </div>
            </div>
          </div>
          <Skel aspect="4 / 5" />
        </div>
        <div style={{ marginTop: 32 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 28,
                padding: '28px 0',
                borderBottom: '1px solid var(--line)',
              }}
            >
              <div style={{ flex: 1 }}>
                <Skel width="60%" height={28} />
                <div style={{ marginTop: 12 }}>
                  <Skel width="100%" height={14} />
                </div>
                <div style={{ marginTop: 8 }}>
                  <Skel width="40%" height={14} />
                </div>
              </div>
              <div style={{ width: 200, height: 200 }}>
                <Skel width={200} height={200} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

function Skel({
  width,
  height,
  aspect,
}: {
  width?: number | string;
  height?: number | string;
  aspect?: string;
}) {
  return (
    <div
      style={{
        width: width ?? '100%',
        height,
        aspectRatio: aspect,
        background: 'var(--bg-soft)',
        borderRadius: 4,
        animation: 'cc-pulse 1.6s ease-in-out infinite',
      }}
    />
  );
}
