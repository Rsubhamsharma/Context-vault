import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Sparkles, Info, FileText } from 'lucide-react';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { projectService } from '../../services/project.service';
import { contextService } from '../../services/context.service';

const setupSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  initialContext: z.string().min(10, 'Please provide some initial context (at least 10 characters)'),
});

type SetupFormValues = z.infer<typeof setupSchema>;

const INITIAL_CONTEXT_TEMPLATE = `Project Goal:
[Describe what this project is and what it aims to achieve]

Tech Stack:
- Language: 
- Framework: 
- Database: 

Current Features:
- [Feature 1]: [Brief description]
- [Feature 2]: [Brief description]

Important Decisions:
- [Decision 1]: [Why it was made]

Current Issues:
- [Issue 1]: [What is blocking/broken]

Constraints:
- [Constraint 1]: [e.g. Must support mobile, Must be accessible]

Next Steps:
- [Step 1]: [Immediate priority]`;

export const GuidedProjectSetup = ({ 
  isOpen, 
  onClose, 
  onSuccess 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSuccess: (projectId: string) => void;
}) => {
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiFailed, setAiFailed] = useState(false);
  const [lastProjectId, setLastProjectId] = useState<string | null>(null);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<SetupFormValues>({
    resolver: zodResolver(setupSchema),
  });

  const handleApplyTemplate = () => {
    setValue('initialContext', INITIAL_CONTEXT_TEMPLATE);
  };

  const onSubmit = async (data: SetupFormValues, skipAI: boolean = false) => {
    setError(null);
    setIsInitializing(true);
    try {
      let projectId = lastProjectId;
      if (!projectId) {
        const projectRes = await projectService.createProject({
          name: data.name,
          description: data.description,
        });
        projectId = projectRes.data.id;
        setLastProjectId(projectId);
      }

      await contextService.updateContext(projectId, {
        rawInput: data.initialContext,
        skipAI: skipAI,
      });

      onSuccess(projectId);
    } catch (err: any) {
      if (lastProjectId) {
        setAiFailed(true);
        setError('AI initialization failed. You can retry or continue without AI.');
      } else {
        setError(err?.response?.data?.message || 'An unexpected error occurred while setting up your project.');
      }
    } finally {
      setIsInitializing(false);
    }
  };


  const handleFormSubmit = (data: SetupFormValues) => {
    onSubmit(data, false);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Guided Project Setup" 
      size="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 py-2">
        <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl p-4 border border-indigo-100 dark:border-indigo-500/20 flex gap-3 items-start">
          <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <p className="text-sm text-indigo-900 dark:text-indigo-200 leading-relaxed">
            We'll create your project vault and use AI to extract its first version of memory. 
            This ensures your AI assistants have a structured source of truth from day one.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Input 
              label="Project Name" 
              {...register('name')} 
              error={errors.name?.message} 
              placeholder="e.g. AI Memory Vault" 
            />
            <Textarea 
              label="Project Goal (Optional)" 
              {...register('description')} 
              placeholder="What is this project about?" 
              className="min-h-[100px]" 
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-primary dark:text-text-primary">
                Initial Project Context
              </label>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={handleApplyTemplate} 
                className="text-[11px] h-7 gap-1.5"
              >
                <FileText className="w-3 h-3" /> Use Template
              </Button>
            </div>
            <Textarea 
              {...register('initialContext')} 
              error={errors.initialContext?.message} 
              placeholder="Paste your PRD, feature list, tech stack, or a brain dump of the project..." 
              className="min-h-[200px] font-mono text-xs" 
            />
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
          {aiFailed && (
            <Button 
              type="button"
              variant="outline"
              onClick={() => handleSubmit((data) => onSubmit(data, false))}
              isLoading={isInitializing}
              className="gap-2"
            >
              Retry AI Initialization
            </Button>
          )}
          
          <Button 
            type="button"
            variant="ghost" 
            onClick={onClose}
          >
            Cancel
          </Button>

          {aiFailed ? (
            <Button 
              type="button"
              onClick={() => handleSubmit((data) => onSubmit(data, true))} 
              isLoading={isInitializing}
              className="gap-2 bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <Sparkles className="w-4 h-4" /> Continue Without AI
            </Button>
          ) : (
            <Button 
              type="submit" 
              isLoading={isInitializing} 
              className="gap-2 bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <Sparkles className="w-4 h-4" /> 
              {isInitializing ? 'Initializing Vault...' : 'Create & Initialize'}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
};
