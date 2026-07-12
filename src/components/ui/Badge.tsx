// components/ui/Badge.tsx
import { cn } from '../../lib/utils';

type BadgeProps = {
  children: React.ReactNode;
  variant?: 'default' | 'amber' | 'green' | 'gray' | 'muted';
  size?: 'sm' | 'md';
  className?: string;
};

export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  className,
}: BadgeProps) {
  const variants = {
    default: 'bg-ink-800 text-white border border-ink-700',
    amber: 'bg-amber-400 text-ink-950 border border-amber-400',
    green: 'bg-green-600 text-white border border-green-600',
    gray: 'bg-gray-700 text-gray-100 border border-gray-600',
    muted: 'bg-ink-800 text-muted-light border border-ink-700',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 rounded-full',
    md: 'text-xs px-2.5 py-1 rounded-full',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center font-medium transition-colors',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}