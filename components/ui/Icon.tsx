import { type SVGProps } from 'react';

export type IconName =
  | 'search'
  | 'pin'
  | 'bag'
  | 'arrow-right'
  | 'arrow-left'
  | 'plus'
  | 'minus'
  | 'close'
  | 'star'
  | 'check'
  | 'shield'
  | 'clock'
  | 'sort'
  | 'filter'
  | 'leaf'
  | 'fire'
  | 'heart'
  | 'heart-fill';

type Props = Omit<SVGProps<SVGSVGElement>, 'width' | 'height' | 'stroke' | 'strokeWidth'> & {
  name: IconName;
  size?: number;
  stroke?: number;
};

export function Icon({ name, size = 18, stroke = 1.6, className, ...rest }: Props) {
  const base = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: stroke,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    ...rest,
  } satisfies SVGProps<SVGSVGElement>;

  switch (name) {
    case 'search':
      return (
        <svg {...base}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      );
    case 'pin':
      return (
        <svg {...base}>
          <path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11Z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      );
    case 'bag':
      return (
        <svg {...base}>
          <path d="M5 8h14l-1 12H6L5 8Z" />
          <path d="M9 8V6a3 3 0 0 1 6 0v2" />
        </svg>
      );
    case 'arrow-right':
      return (
        <svg {...base}>
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        </svg>
      );
    case 'arrow-left':
      return (
        <svg {...base}>
          <path d="M19 12H5" />
          <path d="m11 18-6-6 6-6" />
        </svg>
      );
    case 'plus':
      return (
        <svg {...base}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case 'minus':
      return (
        <svg {...base}>
          <path d="M5 12h14" />
        </svg>
      );
    case 'close':
      return (
        <svg {...base}>
          <path d="M6 6l12 12M18 6l-6 6-6 6" />
        </svg>
      );
    case 'star':
      return (
        <svg {...base} fill="currentColor" stroke="none">
          <path d="M12 2.5l2.9 6.1 6.6.6-5 4.6 1.5 6.7L12 17.3 5.9 20.5l1.5-6.7-5-4.6 6.6-.6L12 2.5Z" />
        </svg>
      );
    case 'check':
      return (
        <svg {...base}>
          <path d="m5 12 4 4 10-10" />
        </svg>
      );
    case 'shield':
      return (
        <svg {...base}>
          <path d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case 'clock':
      return (
        <svg {...base}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case 'sort':
      return (
        <svg {...base}>
          <path d="M3 6h13M3 12h9M3 18h5" />
          <path d="m18 14 3 3-3 3" />
          <path d="M21 17h-9" />
        </svg>
      );
    case 'filter':
      return (
        <svg {...base}>
          <path d="M3 5h18M6 12h12M10 19h4" />
        </svg>
      );
    case 'leaf':
      return (
        <svg {...base}>
          <path d="M11 20A7 7 0 0 1 4 13c0-5 5-9 13-9 0 8-4 13-9 13a7 7 0 0 1-3-1" />
          <path d="M4 20s4-7 9-9" />
        </svg>
      );
    case 'fire':
      return (
        <svg {...base}>
          <path d="M12 3c2 4 5 5 5 9a5 5 0 1 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3 0-5 1-8Z" />
        </svg>
      );
    case 'heart':
      return (
        <svg {...base}>
          <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z" />
        </svg>
      );
    case 'heart-fill':
      return (
        <svg {...base} fill="currentColor" stroke="currentColor">
          <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z" />
        </svg>
      );
    default:
      return null;
  }
}
