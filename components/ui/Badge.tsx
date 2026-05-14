import clsx from 'clsx';

const STATE_STYLES: Record<string, string> = {
  DRAFT:             'bg-slate-100 text-slate-600',
  PLACED:            'bg-blue-50 text-blue-700',
  COOK_ACCEPTED:     'bg-blue-100 text-blue-800',
  COOK_DECLINED:     'bg-red-50 text-red-700',
  PREPARING:         'bg-amber-50 text-amber-800',
  READY_FOR_PICKUP:  'bg-amber-100 text-amber-800',
  DRIVER_ASSIGNED:   'bg-violet-50 text-violet-700',
  PICKED_UP:         'bg-violet-100 text-violet-800',
  DELIVERED:         'bg-green-50 text-green-700',
  COMPLETED:         'bg-green-100 text-green-800',
  CANCELLED:         'bg-red-100 text-red-700',
  REFUNDED:          'bg-slate-100 text-slate-500',
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
  const style = STATE_STYLES[state] ?? 'bg-slate-100 text-slate-600';
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
