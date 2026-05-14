type Props = { minutes?: number; hours?: number; label?: string };

export function TimeChip({ minutes, hours, label }: Props) {
  const text =
    label ?? (hours ? `${hours} h` : minutes != null ? `${minutes} min` : '');
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur text-[#f5f1ec] text-xs font-medium">
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-brand-400"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      {text}
    </span>
  );
}
