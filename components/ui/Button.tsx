import { type ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
};

export function Button({ variant = 'primary', size = 'md', className, ...props }: Props) {
  const base =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 ' +
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 ' +
    'disabled:opacity-50 disabled:cursor-not-allowed';
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  const variants = {
    primary:
      'bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white shadow-sm hover:shadow',
    secondary:
      'bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 text-slate-900',
    ghost: 'hover:bg-slate-100 text-slate-700 hover:text-slate-900',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
  };
  return (
    <button className={clsx(base, sizes[size], variants[variant], className)} {...props} />
  );
}
