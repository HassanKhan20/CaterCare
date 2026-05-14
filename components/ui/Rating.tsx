type Props = {
  value: number; // 0-5
  size?: 'sm' | 'md';
};

export function Rating({ value, size = 'sm' }: Props) {
  const sizeCls = size === 'sm' ? 'text-xs' : 'text-sm';
  const stars = Array.from({ length: 5 }).map((_, i) => i < Math.round(value));
  return (
    <div className={`flex items-center gap-0.5 ${sizeCls}`}>
      {stars.map((filled, i) => (
        <span key={i} className={filled ? 'text-brand-400' : 'text-[#34302d]'}>
          ★
        </span>
      ))}
    </div>
  );
}
