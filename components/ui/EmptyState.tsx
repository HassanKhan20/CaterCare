import type { ReactNode } from 'react';

type Props = {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <div className="text-5xl mb-4 opacity-70">{icon}</div>
      <h3 className="text-lg font-semibold text-[#f5f1ec] mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-[#f5f1ec]/50 max-w-xs leading-relaxed mb-6">{description}</p>
      )}
      {action}
    </div>
  );
}
