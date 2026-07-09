import { type ReactNode } from 'react';
import { cn } from '../../lib/utils';

type Props = {
  children: ReactNode;
  variant?: 'default' | 'amber' | 'success' | 'outline' | 'muted';
  className?: string;
  icon?: ReactNode;
};

export function Badge({ children, variant = 'default', className, icon }: Props) {
  const variants = {
    default: 'bg-ink-800 text-muted-light border-ink-600',
    amber: 'bg-amber-400/10 text-amber-400 border-amber-400/30',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    outline: 'bg-transparent text-white border-ink-500',
    muted: 'bg-ink-900 text-muted border-ink-700',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider border',
        variants[variant],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
