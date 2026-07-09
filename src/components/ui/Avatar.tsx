import { cn, initials } from '../../lib/utils';

type Props = {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  ring?: boolean;
};

export function Avatar({ name, src, size = 'md', className, ring }: Props) {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-12 w-12 text-sm',
    lg: 'h-16 w-16 text-lg',
    xl: 'h-24 w-24 text-2xl',
  };
  return (
    <div
      className={cn(
        'relative rounded-full overflow-hidden flex items-center justify-center bg-ink-800 border border-ink-600 shrink-0',
        sizes[size],
        ring && 'ring-2 ring-amber-400/40 ring-offset-2 ring-offset-ink-950',
        className,
      )}
    >
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span className="font-bold text-amber-400">{initials(name) || '?'}</span>
      )}
    </div>
  );
}
