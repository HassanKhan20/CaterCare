import { type InputHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        suppressHydrationWarning
        className={clsx(
          'w-full px-4 py-3 rounded-full text-[#f5f1ec] bg-[var(--color-surface-2)]',
          'border border-[var(--color-surface-3)]',
          'placeholder:text-[#6b6663]',
          'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className,
        )}
        {...props}
      />
    );
  },
);
