import type { TextareaHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = ({ label, error, className, ...props }: TextareaProps) => {
  return (
    <div className="w-full space-y-1.5">
      {label && <label className="text-sm font-medium text-text-primary">{label}</label>}
      <textarea
        className={cn(
          'flex min-h-[120px] w-full rounded-lg border border-surface-border dark:border-accent/10 bg-white dark:bg-surface-elevated px-3 py-2 text-sm text-text-primary placeholder:text-stone-400 dark:placeholder:text-text-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
          error && 'border-red-500 focus-visible:ring-red-500',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};
