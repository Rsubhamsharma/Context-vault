import type { ReactNode, HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'accent' | 'outline';
  children: ReactNode;
}

export const Badge = ({ variant = 'default', children, className, ...props }: BadgeProps) => {
  const variants = {
    default: 'bg-stone-100 text-stone-700 border-stone-200',
    accent: 'bg-accent/10 text-accent border-accent/20',
    outline: 'bg-transparent text-stone-600 border-stone-300',
  };

  return (
    <div className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
      variants[variant],
      className
    )} {...props}>
      {children}
    </div>
  );
};
