import clsx from 'clsx';

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        'inline-block w-5 h-5 rounded-full border-2 border-slate-200 border-t-brand-500 animate-spin',
        className,
      )}
      role="status"
      aria-label="Loading"
    />
  );
}
