import { type HTMLAttributes } from 'react';
import clsx from 'clsx';

type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'elevated' | 'flat';
};

export function Card({ className, variant = 'default', ...props }: CardProps) {
  const variants = {
    default: 'bg-[var(--color-surface-1)] border border-[var(--color-surface-3)]',
    elevated: 'bg-[var(--color-surface-2)] border border-[var(--color-surface-3)] shadow-lg',
    flat: 'bg-[var(--color-surface-1)]',
  };
  return (
    <div
      className={clsx(
        'rounded-2xl text-[#f5f1ec] p-6',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
