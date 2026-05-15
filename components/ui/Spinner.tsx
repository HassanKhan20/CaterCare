import clsx from 'clsx';

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        'inline-block w-5 h-5 rounded-full border-2 border-[var(--color-surface-3)] border-t-brand-400 animate-spin',
        className,
      )}
      role="status"
      aria-label="Loading"
    />
  );
}
