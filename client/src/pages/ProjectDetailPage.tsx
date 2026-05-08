import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '../components/layout/AppLayout';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Textarea } from '../components/ui/Textarea';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { CopyButton } from '../components/ui/CopyButton';
import { projectService } from '../services/project.service';
import { contextService } from '../services/context.service';
import { exportService } from '../services/export.service';
import { contextHistoryService } from '../services/contextHistory.service';
import type { ProjectContext } from '../types/context.types';
import type { ExportTarget, ExportMode, ExportResponse, ExportRequest } from '../types/export.types';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Sparkles } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { VersionTimeline } from '../components/timeline/VersionTimeline';
import { VersionCompareView } from '../components/timeline/VersionCompareView';
import { CleanupPreviewView } from '../components/timeline/CleanupPreviewView';
import { ContextSearch } from '../components/vault/ContextSearch';

import { VaultHeader } from '../components/vault/VaultHeader';
import { MemorySectionNav } from '../components/vault/MemorySectionNav';
import type { SectionType } from '../components/vault/MemorySectionNav';
import { MemorySectionPanel, FolderList, SectionBlock } from '../components/vault/MemorySectionPanel';
import { SectionHeader } from '../components/ui/SectionHeader';
import { DeleteConfirmation } from '../components/vault/DeleteConfirmation';

const updateSchema = z.object({
  rawInput: z.string().min(10, 'Input must be at least 10 characters'),
});

type UpdateFormValues = z.infer<typeof updateSchema>;

export const ProjectDetailPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isCleanupOpen, setIsCleanupOpen] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [exportResult, setExportResult] = useState<ExportResponse['data'] | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<ExportTarget>('chatgpt');
  const [selectedMode, setSelectedMode] = useState<ExportMode>('full');
  const [selectedTask, setSelectedTask] = useState<string>('');
  
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [restoreVersion, setRestoreVersion] = useState<number | null>(null);
  const [activeVersion, setActiveVersion] = useState<number | null>(null);
  const [currentContext, setCurrentContext] = useState<ProjectContext | null>(null);
  const [currentVersion, setCurrentVersion] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState<SectionType>('overview');
  const [compareVersions, setCompareVersions] = useState<{ from: number; to: number } | null>(null);

  const { data: projectData, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectService.getProject(projectId!),
    enabled: !!projectId,
  });

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['history', projectId],
    queryFn: () => contextHistoryService.getHistory(projectId!),
    enabled: !!projectId,
  });

  useEffect(() => {
    if (historyData?.data && historyData.data.length > 0) {
      const latest = historyData.data[0];
      setCurrentContext(latest.contextJson);
      setCurrentVersion(latest.versionNumber);
      setActiveVersion(latest.versionNumber);
    }
  }, [historyData]);

  const handleVersionSelect = (version: number) => {
    const versionData = historyData?.data.find(v => v.versionNumber === version);
    if (versionData) {
      setCurrentContext(versionData.contextJson);
      setCurrentVersion(version);
      setActiveVersion(version);
      setCompareVersions(null); // Clear comparison when viewing a specific version
    }
  };

  const handleCompareVersions = (from: number, to: number) => {
    setCompareVersions({ from, to });
    setActiveVersion(null); // Clear active version when comparing
  };

  const handleRestoreVersion = (version: number) => {
    setRestoreVersion(version);
    setIsRestoreOpen(true);
  };

  const handleJumpToSection = (sectionId: string) => {
    setActiveSection(sectionId as SectionType);
    
    // Scroll after the section has been rendered in the DOM
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 0);
  };

  const updateMutation = useMutation({
    mutationFn: (formData: UpdateFormValues) =>
      contextService.updateContext(projectId!, { rawInput: formData.rawInput }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['snapshot', projectId] });
      queryClient.invalidateQueries({ queryKey: ['history', projectId] });
      setIsUpdateOpen(false);
      reset();
      setUpdateError(null);
    },
    onError: (error: any) => {
      const status = error?.response?.status;
      if (status === 503) {
        setUpdateError('AI extraction is temporarily unavailable. Your vault was not changed. Please try again.');
      } else {
        setUpdateError(error?.response?.data?.message || 'An unexpected error occurred. Please try again.');
      }
    },
  });


  const exportMutation = useMutation({
    mutationFn: ({ request }: { request: ExportRequest }) =>
      exportService.exportContext(projectId!, request),
    onSuccess: (res) => {
      setExportResult(res.data);
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (versionNumber: number) =>
      contextService.restoreVersion(projectId!, { versionNumber }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['snapshot', projectId] });
      queryClient.invalidateQueries({ queryKey: ['history', projectId] });
      setIsRestoreOpen(false);
      setRestoreVersion(null);
    },
  });

  const cleanupPreviewMutation = useMutation({
    mutationFn: () => contextService.previewCleanup(projectId!),
    onSuccess: () => {
      // Result is stored in mutation data, can be accessed in UI
    },
  });

  const applyCleanupMutation = useMutation({
    mutationFn: (cleanedContext: ProjectContext) =>
      contextService.applyCleanup(projectId!, cleanedContext),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['snapshot', projectId] });
      queryClient.invalidateQueries({ queryKey: ['history', projectId] });
      cleanupPreviewMutation.reset();
      setIsCleanupOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => projectService.deleteProject(projectId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      navigate('/dashboard');
    },
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm<UpdateFormValues>({
    resolver: zodResolver(updateSchema),
  });

  const isLoading = projectLoading || historyLoading;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <LoadingSpinner className="w-10 h-10" />
        </div>
      </AppLayout>
    );
  }

  const project = projectData?.data;

  if (!project) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <h2 className="text-xl font-bold text-primary mb-2">Project not found</h2>
          <p className="text-text-secondary mb-6">This vault does not exist or you don't have access.</p>
          <Button onClick={() => navigate('/dashboard')} className="">Back to Vaults</Button>
        </div>
      </AppLayout>
    );
  }

  const counts: Record<SectionType, number> = currentContext ? {
    overview: 0,
    features: (currentContext.features?.length || 0) + (currentContext.removed_features?.length || 0),
    decisions: currentContext.decisions?.length || 0,
    issues: (currentContext.current_issues?.length || 0) + (currentContext.resolved_issues?.length || 0),
    dependencies: currentContext.dependencies?.length || 0,
    constraints: currentContext.important_constraints?.length || 0,
    next_steps: currentContext.next_steps?.length || 0,
    history: historyData?.data?.length || 0,
  } : { overview: 0, features: 0, decisions: 0, issues: 0, dependencies: 0, constraints: 0, next_steps: 0, history: 0 };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto pb-12">
        <VaultHeader 
          project={project}
          currentVersion={currentVersion}
          onRefresh={() => queryClient.invalidateQueries({ queryKey: ['history', projectId] })}
          onExport={() => setIsExportOpen(true)}
          onCleanup={() => setIsCleanupOpen(true)}
           onAddUpdate={() => {
            setUpdateError(null);
            setIsUpdateOpen(true);
          }}
           onDelete={() => setIsDeleteOpen(true)}
          hasContext={!!currentContext}
        />


        {!currentContext ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center py-20 px-4"
          >
            <div className="max-w-md w-full bg-surface dark:bg-surface-elevated text-center py-12 px-8 rounded-xl border border-surface-border dark:border-surface-border shadow-sm">
              <div className="w-12 h-12 rounded-full bg-stone-50 dark:bg-surface flex items-center justify-center mx-auto mb-6 border border-surface-border dark:border-surface-border">
                <Zap className="w-6 h-6 text-stone-400 dark:text-accent" />
              </div>
              <h2 className="text-xl font-bold text-primary mb-3">Start building your project memory</h2>
              <p className="text-sm text-text-secondary mb-8 leading-relaxed">
                Your vault is currently empty. Add notes from your first session to automatically organize goals, features, and next steps.
              </p>
              <Button onClick={() => setIsUpdateOpen(true)} className="w-full gap-2">
                Add your first session update
              </Button>
            </div>
          </motion.div>
        ) : (

          <div className="grid md:grid-cols-12 gap-8">
            <div className="md:col-span-3">
              <MemorySectionNav 
                activeSection={activeSection} 
                onSelect={setActiveSection} 
                counts={counts} 
              />
            </div>
            
             <div className="md:col-span-9 space-y-4">
               <div className={`flex justify-end ${activeSection === 'history' ? 'mb-2' : '-mb-2'}`}>
                 <ContextSearch 
                   context={currentContext} 
                   history={historyData?.data || []}
                   onJumpToSection={handleJumpToSection} 
                   onVersionSelect={handleVersionSelect}
                 />
               </div>
              <AnimatePresence mode="wait">
                {activeSection === 'overview' && (
                  <MemorySectionPanel title="Overview" id="overview">
                    <SectionBlock title="Project Goal">
                      <p className="text-primary leading-relaxed">
                        {currentContext.project_goal || <span className="text-text-secondary italic">Not specified yet.</span>}
                      </p>
                    </SectionBlock>
                    <SectionBlock title="Tech Stack">
                      <FolderList items={currentContext.tech_stack} />
                    </SectionBlock>
                  </MemorySectionPanel>
                )}
                
                {activeSection === 'features' && (
                  <MemorySectionPanel title="Features" isEmpty={counts.features === 0} id="features">
                    {currentContext.features?.length > 0 && (
                      <SectionBlock title="Active Features">
                        <FolderList items={currentContext.features} bulletColor="bg-accent" />
                      </SectionBlock>
                    )}
                    {currentContext.removed_features?.length > 0 && (
                      <SectionBlock title="Deprecated Features">
                        <FolderList items={currentContext.removed_features} bulletColor="bg-surface-border" />
                      </SectionBlock>
                    )}
                  </MemorySectionPanel>
                )}
                
                {activeSection === 'decisions' && (
                  <MemorySectionPanel title="Decisions" isEmpty={counts.decisions === 0} id="decisions">
                    <SectionBlock title="Important Decisions">
                      <FolderList items={currentContext.decisions} />
                    </SectionBlock>
                  </MemorySectionPanel>
                )}
                
                {activeSection === 'issues' && (
                  <MemorySectionPanel title="Issues" isEmpty={counts.issues === 0} id="issues">
                    {currentContext.current_issues?.length > 0 && (
                      <SectionBlock title="Current Issues">
                        <FolderList items={currentContext.current_issues} bulletColor="bg-red-400" />
                      </SectionBlock>
                    )}
                    {currentContext.resolved_issues?.length > 0 && (
                      <SectionBlock title="Resolved Issues">
                        <FolderList items={currentContext.resolved_issues} bulletColor="bg-emerald-400" />
                      </SectionBlock>
                    )}
                  </MemorySectionPanel>
                )}
                
                {activeSection === 'dependencies' && (
                  <MemorySectionPanel title="Dependencies" isEmpty={counts.dependencies === 0} id="dependencies">
                    <SectionBlock title="Dependencies">
                      <FolderList items={currentContext.dependencies} />
                    </SectionBlock>
                  </MemorySectionPanel>
                )}
                
                {activeSection === 'constraints' && (
                  <MemorySectionPanel title="Constraints" isEmpty={counts.constraints === 0} id="constraints">
                    <SectionBlock title="Important Constraints">
                      <FolderList items={currentContext.important_constraints} bulletColor="bg-stone-200 dark:bg-surface-border" />
                    </SectionBlock>
                  </MemorySectionPanel>
                )}
                
                {activeSection === 'next_steps' && (
                  <MemorySectionPanel title="Next Steps" isEmpty={counts.next_steps === 0} id="next_steps">
                    <SectionBlock title="Next Steps">
                      <FolderList items={currentContext.next_steps} bulletColor="bg-primary" />
                    </SectionBlock>
                  </MemorySectionPanel>
                )}
                
                {activeSection === 'history' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-5 border-r border-surface-border/50 pr-4 lg:sticky lg:top-8 max-h-[70vh] lg:max-h-[calc(100vh-220px)] overflow-y-auto custom-scrollbar">
                      <SectionHeader title="Timeline" />
                      <VersionTimeline 
                        history={historyData?.data || []}
                        activeVersion={activeVersion}
                        onVersionSelect={handleVersionSelect}
                        onCompareVersions={handleCompareVersions}
                        onRestoreVersion={handleRestoreVersion}
                      />
                    </div>
                    <div className="lg:col-span-7 h-full">
                      <VersionCompareView 
                        projectId={projectId!} 
                        versions={historyData?.data?.map(v => ({ 
                          versionNumber: v.versionNumber, 
                          createdAt: (v.createdAt as any).toISOString ? (v.createdAt as any).toISOString() : String(v.createdAt) 
                        })) || []} 
                        initialFrom={compareVersions?.from}
                        initialTo={compareVersions?.to}
                        onClose={() => setCompareVersions(null)}
                      />
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>


      {/* Update Modal */}
      <Modal
        isOpen={isUpdateOpen}
        onClose={() => setIsUpdateOpen(false)}
        title="Process Session Update"
        size="md"
      >
        <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))} className="space-y-4">
          {updateError && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
              {updateError}
            </div>
          )}
          <Textarea
            label="Paste session notes, AI handoffs, or a summary of what was achieved..."
            {...register('rawInput')}
            error={errors.rawInput?.message}
            placeholder="Example: Implemented the new export endpoint. Fixed a bug in the JWT middleware. Next we need to build the frontend dashboard..."
            className="min-h-[180px]"
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" type="button" onClick={() => setIsUpdateOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={updateMutation.isPending} className="">
              {updateMutation.isPending ? 'Processing...' : 'Extract & Merge'}
            </Button>
          </div>
        </form>
      </Modal>

        {/* Export Modal */}
        <Modal
          isOpen={isExportOpen}
          onClose={() => {
            setIsExportOpen(false);
            setExportResult(null);
          }}
          title="Export Project Context"
          size="lg"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div className="w-full">
                <label className="text-sm font-medium text-primary mb-1.5 block">Export Target</label>
                <select
                  value={selectedTarget}
                  onChange={(e) => setSelectedTarget(e.target.value as ExportTarget)}
                  className="w-full h-10 rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
                >
                  <option value="chatgpt">ChatGPT</option>
                  <option value="claude">Claude</option>
                  <option value="cursor">Cursor</option>
                  <option value="windsurf">Windsurf</option>
                  <option value="generic_markdown">Generic Markdown</option>
                  <option value="json">JSON</option>
                </select>
              </div>
              <div className="w-full">
                <label className="text-sm font-medium text-primary mb-1.5 block">Export Mode</label>
                <select
                  value={selectedMode}
                  onChange={(e) => setSelectedMode(e.target.value as ExportMode)}
                  className="w-full h-10 rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
                >
                  <option value="full">Full Export (Complete context)</option>
                  <option value="compact">Compact Export (Essential state)</option>
                  <option value="smart">Smart Export (Task-optimized)</option>
                </select>
              </div>
            </div>

            {selectedMode === 'smart' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1.5"
              >
                <label className="text-sm font-medium text-primary block">What are you working on?</label>
                <input
                  type="text"
                  value={selectedTask}
                  onChange={(e) => setSelectedTask(e.target.value)}
                  placeholder="e.g. Add GitHub integration, Fix context search..."
                  className="w-full h-10 rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
                />
              </motion.div>
            )}

            <div className="flex justify-end">
                <Button
                  onClick={() => exportMutation.mutate({ 
                    request: { 
                      target: selectedTarget, 
                      mode: selectedMode, 
                      task: selectedTask,
                      forceRegenerate: false 
                    } 
                  })}
                  isLoading={exportMutation.isPending}
                  disabled={selectedMode === 'smart' && !selectedTask.trim()}
                  className=""
                >
                  Export
                </Button>
            </div>
          
            <AnimatePresence>
              {exportResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-primary">
                          Result ({exportResult.target} / {exportResult.mode})
                        </span>
                        {exportResult.cacheStatus && (
                          <span className="px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-[10px] font-medium text-text-secondary border border-stone-200 dark:border-stone-700">
                            {exportResult.cacheStatus === 'hit' ? 'Cached' : exportResult.cacheStatus === 'regenerated' ? 'Regenerated' : exportResult.cacheStatus}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {exportResult.mode === 'smart' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              exportMutation.mutate({ 
                                request: { 
                                  target: exportResult.target, 
                                  mode: 'smart', 
                                  task: exportResult.originalTask || selectedTask,
                                  forceRegenerate: true 
                                } 
                              });
                            }}
                            className="h-8 text-[11px] px-2"
                          >
                            Regenerate
                          </Button>
                        )}
                        <CopyButton text={exportResult.content} />
                      </div>
                    </div>

                  <div className="p-4 bg-stone-900 text-stone-100 rounded-xl font-mono text-xs overflow-auto max-h-96 whitespace-pre-wrap border border-stone-800">
                    {exportResult.content}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-2">
                    <div className="p-2 rounded-lg bg-surface border border-surface-border">
                      <p className="text-[10px] text-text-secondary uppercase font-bold">Full Mode</p>
                      <p className="text-xs font-medium text-primary">~{exportResult.fullEstimatedTokens.toLocaleString()} tokens</p>
                    </div>
                    <div className="p-2 rounded-lg bg-surface border border-surface-border">
                      <p className="text-[10px] text-text-secondary uppercase font-bold">Compact Mode</p>
                      <p className="text-xs font-medium text-primary">~{exportResult.compactEstimatedTokens.toLocaleString()} tokens</p>
                    </div>
                    <div className="p-2 rounded-lg bg-surface border border-surface-border col-span-2 sm:col-span-1">
                      <p className="text-[10px] text-text-secondary uppercase font-bold">Characters</p>
                      <p className="text-xs font-medium text-primary">{exportResult.characterCount.toLocaleString()}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Modal>



       {/* Restore Version Modal */}
       <Modal
         isOpen={isRestoreOpen}
         onClose={() => {
           setIsRestoreOpen(false);
           setRestoreVersion(null);
         }}
         title="Restore Version"
         size="sm"
       >
         <div className="space-y-6">
           <div className="text-center">
             <h3 className="text-lg font-bold text-primary mb-2">
               Restore v{restoreVersion} as the latest project context?
             </h3>
             <p className="text-sm text-text-secondary leading-relaxed">
               This will create a new version based on the selected snapshot. Existing history will not be deleted.
             </p>
           </div>
           <div className="flex justify-center gap-3 pt-4">
             <Button variant="ghost" type="button" onClick={() => {
               setIsRestoreOpen(false);
               setRestoreVersion(null);
             }}>
               Cancel
             </Button>
             <Button 
               onClick={() => {
                 if (restoreVersion) {
                   restoreMutation.mutate(restoreVersion);
                 }
               }} 
               isLoading={restoreMutation.isPending}
               className=""
             >
               Restore Version
             </Button>
           </div>
         </div>
       </Modal>

        {/* Delete Confirmation Modal */}
        <DeleteConfirmation
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={() => deleteMutation.mutate()}
          projectName={project.name}
          isLoading={deleteMutation.isPending}
        />

        {/* Cleanup Modal */}
        <Modal
          isOpen={isCleanupOpen}
          onClose={() => {
            setIsCleanupOpen(false);
            cleanupPreviewMutation.reset();
          }}
          title="Clean Up Project Context"
          size="lg"
        >
          <div className="max-w-4xl mx-auto bg-surface dark:bg-surface-elevated rounded-3xl border border-surface-border p-6 sm:p-10 flex flex-col max-h-[90vh] overflow-hidden space-y-4">
            <div className="text-center shrink-0">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-[11px] font-medium border border-accent/20">
                <Sparkles className="w-3 h-3" />
                Applying cleanup creates a new version
              </div>
            </div>
     
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
              {cleanupPreviewMutation.isPending ? (
                <div className="flex items-center justify-center py-20">
                  <LoadingSpinner className="w-8 h-8" />
                  <span className="ml-3 text-sm text-text-secondary">Analyzing context for cleanup...</span>
                </div>
              ) : cleanupPreviewMutation.data ? (
                <div className="space-y-6">
                  <CleanupPreviewView 
                    before={cleanupPreviewMutation.data.data.before}
                    after={cleanupPreviewMutation.data.data.after}
                  />
                  <div className="p-5 bg-white dark:bg-surface-elevated rounded-2xl border border-surface-border shadow-sm">
                    <h4 className="text-xs font-bold text-primary uppercase mb-3 flex items-center gap-2">
                      <Sparkles className="w-3 h-3 text-accent" />
                      Cleanup Summary
                    </h4>
                    <ul className="text-xs text-text-secondary space-y-2 list-disc pl-4">
                      <li>Grouped related features into high-level bullets</li>
                      <li>Removed duplicate entries and noisy details</li>
                      <li>Preserved all safety-critical constraints</li>
                      <li>Normalized tech stack from dependencies/decisions</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 space-y-6">
                  <div className="w-16 h-16 rounded-full bg-stone-100 dark:bg-surface-elevated flex items-center justify-center border border-surface-border">
                    <Sparkles className="w-8 h-8 text-stone-400 dark:text-text-secondary" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-base font-bold text-primary">Ready to optimize your context?</h3>
                    <p className="text-sm text-text-secondary max-w-xs mx-auto">
                      We'll analyze your current vault and suggest a cleaner, more organized version.
                    </p>
                  </div>
                  <Button 
                    onClick={() => cleanupPreviewMutation.mutate()} 
                    isLoading={cleanupPreviewMutation.isPending}
                    className="gap-2 px-6"
                  >
                    <Sparkles className="w-4 h-4" /> Generate Cleanup Preview
                  </Button>
                </div>
              )}
            </div>
     
            {cleanupPreviewMutation.data && (
                    <div className="flex justify-end gap-3 pt-2 shrink-0 border-t border-surface-border dark:border-accent/10">
                      <Button variant="ghost" onClick={() => {
                        setIsCleanupOpen(false);
                        cleanupPreviewMutation.reset();
                      }}>Cancel</Button>
                      <Button 
                        onClick={() => applyCleanupMutation.mutate(cleanupPreviewMutation.data.data.after)}
                        isLoading={applyCleanupMutation.isPending}
                        className="gap-2"
                      >
                        <Sparkles className="w-4 h-4" /> Apply Cleanup
                      </Button>
                    </div>
            )}
          </div>
        </Modal>

     </AppLayout>
   );
 };

