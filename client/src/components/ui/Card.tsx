import type { ReactNode, HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  footer?: ReactNode;
}

export const Card = ({ title, subtitle, footer, children, className, ...props }: CardProps) => {
  return (
    <div className={cn('glass-card overflow-hidden flex flex-col', className)} {...props}>
      {(title || subtitle) && (
        <div className="px-6 py-4 border-b border-surface-border">
          {title && <h3 className="text-lg font-semibold text-text-primary">{title}</h3>}
          {subtitle && <p className="text-sm text-text-secondary mt-0.5">{subtitle}</p>}
        </div>
      )}
      <div className="p-6 flex-1">
        {children}
      </div>
      {footer && <div className="px-6 py-4 bg-stone-50 border-t border-surface-border">{footer}</div>}
    </div>
  );
};
