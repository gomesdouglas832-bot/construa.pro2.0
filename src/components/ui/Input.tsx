import { type InputHTMLAttributes, type TextareaHTMLAttributes, forwardRef, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  icon?: ReactNode;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, icon, className, id, ...rest }, ref) => {
    const inputId = id || rest.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="label-tag">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full bg-ink-900 border border-ink-700 rounded-[10px] px-3.5 py-3 text-sm text-white placeholder:text-muted focus:outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/30 transition-all duration-200',
              icon ? 'pl-10' : '',
              className,
            )}
            {...rest}
          />
        </div>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </div>
    );
  },
);
Input.displayName = 'Input';

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, className, id, ...rest }, ref) => {
    const inputId = id || rest.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="label-tag">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full bg-ink-900 border border-ink-700 rounded-[10px] px-3.5 py-3 text-sm text-white placeholder:text-muted focus:outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/30 transition-all duration-200 resize-none',
            className,
          )}
          {...rest}
        />
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';
