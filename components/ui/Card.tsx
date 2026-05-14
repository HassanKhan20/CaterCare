import { type HTMLAttributes } from 'react';
import clsx from 'clsx';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        'rounded-lg border border-slate-200 bg-white shadow-sm p-6',
        className,
      )}
      {...props}
    />
  );
}
