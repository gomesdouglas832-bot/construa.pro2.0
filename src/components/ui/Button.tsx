import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
type Size = 'sm' | 'md' | 'lg';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  loading?: boolean;
  icon?: ReactNode;
};

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className,
  loading,
  icon,
  disabled,
  ...rest
}: Props) {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-[10px] transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const sizes: Record<Size, string> = {
    sm: 'text-xs px-3 py-2',
    md: 'text-sm px-4 py-2.5',
    lg: 'text-sm px-6 py-3.5',
  };

  const variants: Record<Variant, string> = {
    primary:
      'bg-amber-400 text-ink-950 hover:bg-amber-300 hover:shadow-amber-glow-sm active:scale-[0.98]',
    secondary:
      'bg-ink-850 text-white border border-ink-600 hover:border-ink-500 hover:bg-ink-800',
    ghost: 'text-muted-light hover:text-white hover:bg-ink-800',
    outline:
      'border border-ink-600 text-white hover:border-amber-400 hover:text-amber-400',
    danger:
      'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20',
  };

  return (
    <button
      className={cn(base, sizes[size], variants[variant], className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}
