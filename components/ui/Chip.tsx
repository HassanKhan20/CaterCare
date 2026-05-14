import { type HTMLAttributes } from 'react';
import clsx from 'clsx';

type Props = HTMLAttributes<HTMLSpanElement> & {
  variant?: 'default' | 'brand' | 'success' | 'warning';
  size?: 'sm' | 'md';
};

export function Chip({
  variant = 'default',
  size = 'sm',
  className,
  ...props
}: Props) {
  const variants = {
    default: 'bg-[var(--color-surface-2)] text-[#f5f1ec]/80',
    brand: 'bg-brand-400/15 text-brand-300 border border-brand-400/30',
    success: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  };
  const sizes = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  };
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
