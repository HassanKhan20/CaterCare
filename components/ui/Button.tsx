import { type ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
};

export function Button({ variant = 'primary', className, ...props }: Props) {
  const base =
    'px-4 py-2 rounded-md font-medium transition disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white',
    secondary:
      'bg-white border border-slate-300 hover:bg-slate-50 text-slate-900',
    ghost: 'hover:bg-slate-100 text-slate-900',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };
  return <button className={clsx(base, variants[variant], className)} {...props} />;
}
