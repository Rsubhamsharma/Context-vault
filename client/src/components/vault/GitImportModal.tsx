import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { Input } from '../ui/Input';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { AlertCircle, CheckCircle2, AlertTriangle, History, Eye, XCircle, GitBranch } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contextService } from '../../services/context.service';

interface GitImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onApplySuccess: () => void;
  analyzeMutation: {
    mutate: (data: any) => void;
    isPending: boolean;
    data: any;
    reset: () => void;
  };
  applyMutation: {
    mutate: (data: any) => void;
    isPending: boolean;
    isSuccess?: boolean;
  };
}

export const GitImportModal = ({
  isOpen,
  onClose,
  projectId,
  onApplySuccess,
  analyzeMutation,
  applyMutation,
}: GitImportModalProps) => {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<'input' | 'preview' | 'history' | 'view_suggestion'>('input');
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    changeType: 'commit',
    branch: '',
    baseBranch: '',
    changeText: '',
  });

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['git-import-history', projectId],
    queryFn: () => contextService.getGitImportHistory(projectId),
    enabled: isOpen && (step === 'history' || step === 'view_suggestion'),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ gitImportId, status }: { gitImportId: string; status: string }) => 
      contextService.updateGitImportStatus(projectId, gitImportId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['git-import-history', projectId] });
    },
  });

  const handleApplyFromHistory = (item: any) => {
    applyMutation.mutate({
      projectId,
      gitImportId: item.id,
      rawInput: item.sanitizedInputPreview,
      extractedUpdate: item.suggestedUpdateJson,
    });
  };

  const handleCancelFromHistory = (gitImportId: string) => {
    cancelMutation.mutate({ gitImportId, status: 'cancelled' });
  };

  const handleAnalyze = () => {
    if (!formData.changeText.trim()) return;
    analyzeMutation.mutate({
      projectId,
      ...formData,
    });
  };

  const handleApply = () => {
    const suggestedUpdate = analyzeMutation.data?.data?.suggestedUpdate;
    const rawInput = formData.changeText;
    const gitImportId = analyzeMutation.data?.data?.metadata?.gitImportId;

    applyMutation.mutate({
      projectId,
      gitImportId,
      rawInput,
      extractedUpdate: suggestedUpdate,
    });
  };

  React.useEffect(() => {
    if (analyzeMutation.data) {
      setStep('preview');
    } else if (step !== 'history' && step !== 'view_suggestion') {
      setStep('input');
    }
  }, [analyzeMutation.data]);

  React.useEffect(() => {
    if (applyMutation.isSuccess) {
      queryClient.invalidateQueries({ queryKey: ['git-import-history', projectId] });
      onApplySuccess();
      setStep('input');
      setFormData({ title: '', changeType: 'commit', branch: '', baseBranch: '', changeText: '' });
      analyzeMutation.reset();
      onClose();
    }
  }, [applyMutation.isSuccess]);

  const renderPreview = (update: any, metadata: any = {}) => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-2 rounded-lg bg-surface border border-surface-border text-center">
          <p className="text-[10px] text-text-secondary uppercase font-bold">Type</p>
          <p className="text-xs font-medium text-primary capitalize">{formData.changeType || metadata.changeType || 'N/A'}</p>
        </div>
        <div className="p-2 rounded-lg bg-surface border border-surface-border text-center">
          <p className="text-[10px] text-text-secondary uppercase font-bold">Branch</p>
          <p className="text-xs font-medium text-primary truncate">{formData.branch || metadata.branch || 'N/A'}</p>
        </div>
        <div className="p-2 rounded-lg bg-surface border border-surface-border text-center">
          <p className="text-[10px] text-text-secondary uppercase font-bold">Secrets Redacted</p>
          <p className="text-xs font-medium text-primary">{metadata.secretsRedactedCount || analyzeMutation.data?.data?.metadata?.secretsRedactedCount || 0}</p>
        </div>
        <div className="p-2 rounded-lg bg-surface border border-surface-border text-center">
          <p className="text-[10px] text-text-secondary uppercase font-bold">Risky Files</p>
          <p className="text-xs font-medium text-primary">{metadata.riskyFilesDetected?.length || analyzeMutation.data?.data?.metadata?.riskyFilesDetected?.length || 0}</p>
        </div>
      </div>

      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {Object.entries(update || {}).map(([key, value]) => {
          if (!value || (Array.isArray(value) && value.length === 0)) return null;
          
          const labelMap: Record<string, string> = {
            features_added: 'Suggested Features',
            features_removed: 'Suggested Deprecated Features',
            decisions_made: 'Suggested Decisions',
            issues_found: 'Suggested Issues/Risks',
            issues_resolved: 'Suggested Resolved Issues',
            dependencies_added: 'Suggested Dependencies',
            constraints_added: 'Suggested Constraints',
            next_steps: 'Suggested Next Steps',
            project_goal: 'Suggested Project Goal',
            tech_stack: 'Suggested Tech Stack',
          };

          return (
            <div key={key} className="space-y-2">
              <h4 className="text-xs font-bold text-primary uppercase flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                {labelMap[key] || key}
              </h4>
              {Array.isArray(value) ? (
                <ul className="space-y-1">
                  {value.map((item, i) => (
                    <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-stone-400 mt-2 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-text-secondary italic">{value as string}</p>
              )}
            </div>
          );
        })}
        
        {(metadata.riskyFilesDetected || analyzeMutation.data?.data?.metadata?.riskyFilesDetected)?.length > 0 && (
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 text-xs">
            <div className="flex items-center gap-2 font-bold mb-1">
              <AlertCircle className="w-3 h-3" />
              Risky files detected
            </div>
            <ul className="list-disc pl-4">
              {(metadata.riskyFilesDetected || analyzeMutation.data?.data?.metadata?.riskyFilesDetected).map((file: string, i: number) => (
                <li key={i}>{file}</li>
              ))}
            </ul>
          </div>
        )}

        {metadata.preprocessingMetadata && (
          <div className="p-3 rounded-lg bg-stone-50 dark:bg-surface-elevated border border-surface-border text-[11px] text-text-secondary space-y-1">
            <p className="font-bold text-primary uppercase mb-1">Preprocessing Summary</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <div className="flex justify-between">
                <span>Files detected:</span>
                <span className="font-medium">{metadata.preprocessingMetadata.filesDetected?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Ignored noisy:</span>
                <span className="font-medium">{metadata.preprocessingMetadata.ignoredFiles?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Risky redacted:</span>
                <span className="font-medium">{metadata.preprocessingMetadata.riskyFiles?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Secrets redacted:</span>
                <span className="font-medium">{metadata.preprocessingMetadata.redactionCount || 0}</span>
              </div>
              <div className="flex justify-between col-span-2 border-t border-surface-border pt-1 mt-1">
                <span>Input size reduction:</span>
                <span className="font-medium">
                  {Math.round(metadata.preprocessingMetadata.originalInputSize / 1024)}KB → {Math.round(metadata.preprocessingMetadata.sanitizedInputSize / 1024)}KB
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 rounded-lg bg-stone-100 dark:bg-surface-elevated text-stone-500 dark:text-text-secondary text-xs text-center italic border border-dashed border-surface-border">
        "Nothing is saved to project memory until you click Apply Suggested Update."
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setStep('input');
        analyzeMutation.reset();
        setSelectedHistoryItem(null);
        onClose();
      }}
      title={
        step === 'input' ? 'Import Git Changes' : 
        step === 'preview' ? 'Review Suggested Update' : 
        step === 'history' ? 'Git Import History' : 'Review History Suggestion'
      }
      size="lg"
    >
      <div className="flex gap-1 p-1 bg-stone-100 dark:bg-surface rounded-lg mb-6 w-fit">
        <Button 
          variant={step === 'input' ? 'primary' : 'ghost'} 
          size="sm" 
          onClick={() => { setStep('input'); setSelectedHistoryItem(null); }}
          className="h-8 text-xs"
        >
          New Import
        </Button>
        <Button 
          variant={step === 'history' || step === 'view_suggestion' ? 'primary' : 'ghost'} 
          size="sm" 
          onClick={() => setStep('history')}
          className="h-8 text-xs flex gap-2"
        >
          <History className="w-3 h-3" /> History
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {step === 'input' && (
          <motion.div
            key="input"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="p-4 bg-stone-100 dark:bg-surface-elevated rounded-xl border border-surface-border text-sm text-text-secondary leading-relaxed">
              <p className="mb-2">Paste a commit summary, PR description, changed files list, release notes, or git diff. Context Vault will suggest project memory updates before anything is saved.</p>
              <div className="flex items-start gap-2 text-amber-600 dark:text-amber-400 font-medium">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Review before applying. File changes are not automatically trusted as completed product behavior.</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input 
                  label="Title / Summary (Optional)" 
                  placeholder="e.g. Implement Git Import Feature"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-primary mb-1.5 block">Change Type</label>
                <select
                  value={formData.changeType}
                  onChange={(e) => setFormData({ ...formData, changeType: e.target.value })}
                  className="w-full h-10 rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
                >
                  <option value="commit">Commit</option>
                  <option value="diff">Diff</option>
                  <option value="pull_request">Pull Request</option>
                  <option value="release_notes">Release Notes</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input 
                  label="Branch" 
                  placeholder="feature/..."
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                />
                <Input 
                  label="Base Branch" 
                  placeholder="main"
                  value={formData.baseBranch}
                  onChange={(e) => setFormData({ ...formData, baseBranch: e.target.value })}
                />
              </div>
            </div>

            <Textarea
              label="Change Text"
              placeholder="Paste the git change text here..."
              value={formData.changeText}
              onChange={(e) => setFormData({ ...formData, changeText: e.target.value })}
              className="min-h-[200px]"
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button 
                onClick={handleAnalyze} 
                isLoading={analyzeMutation.isPending}
                disabled={!formData.changeText.trim()}
              >
                Analyze Git Changes
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'preview' && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {renderPreview(analyzeMutation.data?.data?.suggestedUpdate, analyzeMutation.data?.data?.metadata)}
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={() => setStep('input')}>Retry Analysis</Button>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button 
                onClick={handleApply} 
                isLoading={applyMutation.isPending}
                className="bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Apply Suggested Update
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="p-3 rounded-lg bg-stone-100 dark:bg-surface-elevated text-stone-500 dark:text-text-secondary text-xs italic border border-dashed border-surface-border text-center">
              "Git Import History helps you audit analyzed changes. Only applied imports create context versions."
            </div>

            {historyLoading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner className="w-6 h-6" />
              </div>
            ) : historyData?.data?.length === 0 ? (
              <div className="text-center py-12 text-text-secondary text-sm">
                No Git import history found.
              </div>
            ) : (
              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                {historyData?.data?.map((item: any) => (
                  <div key={item.id} className="p-4 rounded-xl border border-surface-border bg-surface dark:bg-surface-elevated flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-primary truncate">{item.title || 'Untitled Import'}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                          item.status === 'applied' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' :
                          item.status === 'cancelled' ? 'bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:border-stone-700' :
                          'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
                        }`}>
                          {item.status}
                        </span>
                        <span className="text-[10px] text-text-secondary">{item.changeType}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-text-secondary">
                        <span className="flex items-center gap-1">
                          <GitBranch className="w-3 h-3" /> {item.branch || 'no branch'}
                        </span>
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        {item.createdVersionId && (
                          <span className="text-accent font-medium">Version Linked</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setSelectedHistoryItem(item);
                          setStep('view_suggestion');
                        }}
                        className="h-8 px-2 gap-1.5 text-xs"
                      >
                        <Eye className="w-3 h-3" /> View
                      </Button>
                      {item.status === 'analyzed' && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleCancelFromHistory(item.id)}
                            className="h-8 px-2 gap-1.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <XCircle className="w-3 h-3" /> Cancel
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => handleApplyFromHistory(item)}
                            className="h-8 px-2 gap-1.5 text-xs bg-indigo-600 text-white hover:bg-indigo-700"
                          >
                            Apply
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
               </div>
             )}

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={onClose}>Close</Button>
              <Button onClick={() => setStep('input')}>New Import</Button>
            </div>
          </motion.div>
        )}

        {step === 'view_suggestion' && (
          <motion.div
            key="view_suggestion"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {selectedHistoryItem && renderPreview(selectedHistoryItem.suggestedUpdateJson, selectedHistoryItem)}
            
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={() => {
                setSelectedHistoryItem(null);
                setStep('history');
              }}>Back to History</Button>
              {selectedHistoryItem?.status === 'analyzed' && (
                <Button 
                  onClick={() => handleApplyFromHistory(selectedHistoryItem)} 
                  isLoading={applyMutation.isPending}
                  className="bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  Apply Suggested Update
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
};
