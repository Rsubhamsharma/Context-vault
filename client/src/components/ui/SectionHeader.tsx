import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface SectionHeaderProps {
  title: string;
  action?: ReactNode;
  className?: string;
}

export const SectionHeader = ({ title, action, className }: SectionHeaderProps) => {
  return (
    <div className={cn('flex items-center justify-between mb-6', className)}>
      <h2 className="text-2xl font-semibold text-text-primary">{title}</h2>
      {action && <div>{action}</div>}
    </div>
  );
};
