import { motion } from 'framer-motion';
import { Plus, Archive } from 'lucide-react';
import { Button } from '../ui/Button';

interface CreateVaultPanelProps {
  onClick: () => void;
}

export const CreateVaultPanel = ({ onClick }: CreateVaultPanelProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface border border-surface-border dark:border-accent/10 rounded-xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-full mb-10"
    >
      <div className="flex items-start sm:items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-stone-50 dark:bg-surface-elevated flex items-center justify-center shrink-0 border border-surface-border/50 dark:border-accent/20">
          <Archive className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Create a new vault</h2>
          <p className="text-sm text-text-secondary">Start a clean memory space for a project.</p>
        </div>
      </div>
      
      <Button 
        onClick={onClick}
        className="shrink-0 gap-2 shadow-sm self-start sm:self-auto"
      >
        <Plus className="w-4 h-4" /> New Vault
      </Button>
    </motion.div>
  );
};
