import { Icon } from '@/components/ui/Icon';

type Props = {
  value?: number;
  size?: number;
};

export function Stars({ value = 5, size = 12 }: Props) {
  return (
    <span
      className="cc-stars"
      style={{ '--star-size': `${size}px` } as React.CSSProperties}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= Math.round(value) ? 'on' : 'off'}>
          <Icon name="star" size={size} />
        </span>
      ))}
    </span>
  );
}
