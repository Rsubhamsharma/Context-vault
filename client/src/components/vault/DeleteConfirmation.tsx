import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface DeleteConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  projectName: string;
  isLoading?: boolean;
}

export const DeleteConfirmation = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  projectName,
  isLoading 
}: DeleteConfirmationProps) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Vault"
      size="sm"
    >
      <div className="space-y-6">
        <div className="flex flex-col items-center text-center">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-4 text-red-500 border border-red-100 dark:border-red-500/20"
          >
            <AlertTriangle className="w-8 h-8" />
          </motion.div>
          <h3 className="text-xl font-bold text-primary mb-2">
            Are you absolutely sure?
          </h3>
          <p className="text-sm text-text-secondary leading-relaxed">
            You are about to delete <span className="font-semibold text-text-primary underline decoration-red-400/30">{projectName}</span>. 
            This action cannot be undone and will permanently remove all version history and project memory.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <Button 
            onClick={onConfirm} 
            isLoading={isLoading}
            className="w-full bg-red-500 hover:bg-red-600 text-white border-none shadow-lg shadow-red-500/20 transition-all active:scale-[0.98]"
          >
            {isLoading ? 'Deleting...' : 'Yes, delete vault'}
          </Button>
          <Button 
            variant="ghost" 
            type="button" 
            onClick={onClose}
            className="w-full text-text-secondary hover:text-text-primary"
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
};
