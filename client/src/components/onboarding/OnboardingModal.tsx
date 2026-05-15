import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Sparkles, Layout, Zap, Search, Layers, ArrowRight } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const STEPS = [
  {
    title: 'Welcome to Context Vault',
    description: 'Context Vault helps you store, update, version, clean, search, and export project memory so AI tools can continue your work without repeated explanations.',
    icon: Sparkles,
    color: 'text-accent'
  },
  {
    title: 'How it works',
    description: 'Create a project vault and add updates. Context Vault structures and versions your memory, allowing you to export it to ChatGPT, Claude, Cursor, or Windsurf.',
    icon: Layout,
    color: 'text-indigo-500'
  },
  {
    title: 'Export Modes',
    description: 'Choose between Full Export (complete context), Compact Export (shorter continuation), or Smart Export (task-specific, AI-optimized context).',
    icon: Layers,
    color: 'text-emerald-500'
  },
  {
    title: 'Cleanup & Search',
    description: 'Automatically group repeated details via Cleanup, and find specific features, decisions, or issues instantly using In-Context Search.',
    icon: Search,
    color: 'text-amber-500'
  },
  {
    title: 'Ready to Begin?',
    description: 'Start your first vault today and ensure your AI assistants always have the exact context they need to be productive.',
    icon: Zap,
    color: 'text-blue-500'
  }
];

export const OnboardingModal = ({ isOpen, onClose, onComplete }: OnboardingModalProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const next = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const skip = () => {
    onComplete();
  };

  if (!isOpen) return null;

  const step = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="" 
      size="sm"
    >
      <div className="flex flex-col items-center text-center py-6 px-4 space-y-8">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center space-y-6"
          >
            <div className={`w-16 h-16 rounded-2xl bg-stone-100 dark:bg-surface flex items-center justify-center border border-surface-border dark:border-accent/20 ${step.color}`}>
              <step.icon className="w-8 h-8" />
            </div>
            
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-primary dark:text-text-primary tracking-tight">
                {step.title}
              </h2>
              <p className="text-sm text-text-secondary leading-relaxed max-w-xs mx-auto">
                {step.description}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="w-full flex items-center justify-between gap-3 pt-6">
          <Button variant="ghost" onClick={skip} className="text-xs">
            Skip
          </Button>
          
          <div className="flex items-center gap-2">
            {/* Step Indicator */}
            <div className="flex gap-1 mr-2">
              {STEPS.map((_, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all duration-300",
                    i === currentStep ? "bg-accent w-4" : "bg-stone-300 dark:bg-stone-700"
                  )} 
                />
              ))}
            </div>

            <Button 
              onClick={next} 
              className="gap-2 px-4 h-9 text-sm"
            >
              {isLastStep ? 'Get Started' : 'Next'} 
              {!isLastStep && <ArrowRight className="w-3 h-3" />}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
