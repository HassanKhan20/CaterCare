import { type ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
};

export function Button({ variant = 'primary', size = 'md', className, ...props }: Props) {
  const base =
    'inline-flex items-center justify-center font-semibold rounded-full transition-all duration-150 ' +
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0f0d0c] focus:ring-brand-400 ' +
    'disabled:opacity-50 disabled:cursor-not-allowed';
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-base',
  };
  const variants = {
    primary:
      'bg-brand-400 hover:bg-brand-300 active:bg-brand-500 text-[#1a1715] shadow-md hover:shadow-lg',
    secondary:
      'bg-[var(--color-surface-2)] border border-[var(--color-surface-3)] hover:bg-[var(--color-surface-3)] text-[#f5f1ec]',
    ghost: 'hover:bg-[var(--color-surface-2)] text-[#f5f1ec]/80 hover:text-[#f5f1ec]',
    danger: 'bg-red-500 hover:bg-red-400 text-white shadow-md',
  };
  return (
    <button className={clsx(base, sizes[size], variants[variant], className)} {...props} />
  );
}
