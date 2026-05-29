import { type ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
};

export function Button({ variant = 'primary', size = 'md', className, ...props }: Props) {
  const base =
    'inline-flex items-center justify-center font-semibold rounded-full transition-all duration-150 ' +
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-surface-0)] focus:ring-brand-400 ' +
    'disabled:opacity-50 disabled:cursor-not-allowed';
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-base',
  };
  // Mirrors the prototype's .cc-btn-* : primary is dark ink with light text
  // (high contrast on the olive palette), accent on hover.
  const variants = {
    primary:
      'bg-[var(--color-text-primary)] hover:bg-[var(--color-brand-500)] active:opacity-90 text-[var(--color-surface-0)] shadow-sm',
    secondary:
      'bg-[var(--color-surface-2)] border border-[var(--color-surface-3)] hover:bg-[var(--color-surface-3)] text-[var(--color-text-primary)]',
    ghost:
      'hover:bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
  };
  return (
    <button className={clsx(base, sizes[size], variants[variant], className)} {...props} />
  );
}
