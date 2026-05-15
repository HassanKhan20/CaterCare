import clsx from 'clsx';

const STATE_STYLES: Record<string, string> = {
  DRAFT:             'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] border border-[var(--color-surface-3)]',
  PLACED:            'bg-blue-500/15 text-blue-300 border border-blue-500/30',
  COOK_ACCEPTED:     'bg-blue-500/20 text-blue-200 border border-blue-500/40',
  COOK_DECLINED:     'bg-red-500/15 text-red-300 border border-red-500/30',
  PREPARING:         'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  READY_FOR_PICKUP:  'bg-amber-500/20 text-amber-200 border border-amber-500/40',
  DRIVER_ASSIGNED:   'bg-violet-500/15 text-violet-300 border border-violet-500/30',
  PICKED_UP:         'bg-violet-500/20 text-violet-200 border border-violet-500/40',
  DELIVERED:         'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  COMPLETED:         'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40',
  CANCELLED:         'bg-red-500/20 text-red-200 border border-red-500/40',
  REFUNDED:          'bg-[var(--color-surface-2)] text-[var(--color-text-tertiary)] border border-[var(--color-surface-3)]',
};

const STATE_LABELS: Record<string, string> = {
  DRAFT:             'Awaiting payment',
  PLACED:            'Order placed',
  COOK_ACCEPTED:     'Cook accepted',
  COOK_DECLINED:     'Declined',
  PREPARING:         'Preparing',
  READY_FOR_PICKUP:  'Ready for pickup',
  DRIVER_ASSIGNED:   'Driver assigned',
  PICKED_UP:         'On the way',
  DELIVERED:         'Delivered',
  COMPLETED:         'Completed',
  CANCELLED:         'Cancelled',
  REFUNDED:          'Refunded',
};

type Props = {
  state: string;
  className?: string;
};

export function Badge({ state, className }: Props) {
  const style = STATE_STYLES[state] ?? 'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]';
  const label = STATE_LABELS[state] ?? state;
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        style,
        className,
      )}
    >
      {label}
    </span>
  );
}
