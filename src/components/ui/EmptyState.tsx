import { type ReactNode } from 'react';

type Props = {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="h-16 w-16 rounded-2xl bg-ink-850 border border-ink-700 flex items-center justify-center text-amber-400 mb-5">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-white mb-1.5">{title}</h3>
      {description && <p className="text-sm text-muted max-w-sm mb-6">{description}</p>}
      {action}
    </div>
  );
}
