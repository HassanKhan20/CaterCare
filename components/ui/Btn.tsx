import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import clsx from 'clsx';
import { Icon, type IconName } from '@/components/ui/Icon';

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  children?: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  full?: boolean;
  icon?: IconName;
  iconAfter?: IconName;
};

export function Btn({
  children,
  variant = 'primary',
  size = 'md',
  full,
  icon,
  iconAfter,
  className,
  ...rest
}: Props) {
  const iconSize = size === 'lg' ? 18 : 15;
  return (
    <button
      type="button"
      className={clsx(
        'cc-btn',
        `cc-btn-${variant}`,
        `cc-btn-${size}`,
        full && 'cc-btn-full',
        className,
      )}
      {...rest}
    >
      {icon && <Icon name={icon} size={iconSize} />}
      {children !== undefined && <span>{children}</span>}
      {iconAfter && <Icon name={iconAfter} size={iconSize} />}
    </button>
  );
}
