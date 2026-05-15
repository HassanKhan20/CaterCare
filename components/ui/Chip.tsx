import { type ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  tone?: 'neutral';
};

export function Chip({ active, tone = 'neutral', className, ...rest }: Props) {
  return (
    <button
      type="button"
      className={clsx('cc-chip', `cc-chip-${tone}`, active && 'is-active', className)}
      {...rest}
    />
  );
}
