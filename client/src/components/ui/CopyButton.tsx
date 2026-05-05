
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';

interface CopyButtonProps {
  text: string;
  className?: string;
}

export const CopyButton = ({ text, className }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      onClick={handleCopy}
      className={cn(
        'p-2 rounded-md transition-colors',
        copied ? 'bg-green-100 text-green-600' : 'bg-stone-100 text-stone-600 hover:bg-stone-200',
        className
      )}
    >
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
    </button>
  );
};
