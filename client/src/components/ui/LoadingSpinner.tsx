import { cn } from '../../lib/utils';

export const LoadingSpinner = ({ className }: { className?: string }) => {
  return (
    <div className={cn('w-5 h-5 border-2 border-stone-300 border-t-stone-900 rounded-full animate-spin', className)} />
  );
};
