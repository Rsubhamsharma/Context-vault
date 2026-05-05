import type { InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = ({ label, error, className, ...props }: InputProps) => {
  return (
    <div className="w-full space-y-1.5">
      {label && <label className="text-sm font-medium text-text-primary">{label}</label>}
      <input
        className={cn(
          'flex h-10 w-full rounded-lg border border-surface-border dark:border-accent/10 bg-white dark:bg-surface-elevated px-3 py-2 text-sm text-text-primary placeholder:text-stone-400 dark:placeholder:text-text-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
          error && 'border-red-500 focus-visible:ring-red-500',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};
