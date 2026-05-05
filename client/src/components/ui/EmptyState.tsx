import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export const EmptyState = ({ title, description, action, icon }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
      {icon && <div className="text-stone-300">{icon}</div>}
      <h3 className="text-lg font-medium text-text-primary">{title}</h3>
      <p className="text-text-secondary max-w-xs">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};
