import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Modal } from '../components/ui/Modal';
import { projectService } from '../services/project.service';
import { Plus, Archive, Search, ArrowUpDown } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { FolderCard } from '../components/vault/FolderCard';
import { DeleteConfirmation } from '../components/vault/DeleteConfirmation';
import type { Project } from '../types/project.types';

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

type SortOption = 'newest' | 'oldest' | 'name-asc' | 'name-desc';

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

export const DashboardPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('newest');

  const { data, isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getProjects,
  });

  const createMutation = useMutation({
    mutationFn: projectService.createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsModalOpen(false);
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: projectService.deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setProjectToDelete(null);
    },
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
  });

  const onSubmit = (formData: ProjectFormValues) => {
    createMutation.mutate(formData);
  };

  const handleDelete = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjectToDelete(project);
  };

  const filteredAndSortedProjects = useMemo(() => {
    const projects = data?.data || [];
    
    const filtered = projects.filter(project => 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      project.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return filtered.sort((a, b) => {
      switch (sortOption) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });
  }, [data, searchQuery, sortOption]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <LoadingSpinner className="w-10 h-10" />
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <h2 className="text-xl font-bold text-primary mb-2">Error loading projects</h2>
          <p className="text-text-secondary mb-6">Please try again later.</p>
        </div>
      </AppLayout>
    );
  }

  const projects = data?.data || [];
  const hasProjects = projects.length > 0;
  const hasFilteredProjects = filteredAndSortedProjects.length > 0;

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Section 1: Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-primary tracking-tight">My Vaults</h1>
            <p className="text-base text-text-secondary mt-1.5">Manage your project contexts</p>
          </div>
          <div>
            <Button 
              onClick={() => setIsModalOpen(true)} 
              className="gap-2 bg-indigo-600 text-white border-none hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all duration-200"
            >
              <Plus className="w-4 h-4" /> New Vault
            </Button>
          </div>
        </div>

        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          
          {/* Section 3: Projects / Empty State */}
          <motion.div variants={itemVariants} className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-primary">Project Vaults</h2>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <Input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search vaults..." 
                    className="pl-9 h-10"
                  />
                </div>
                <div className="relative w-full sm:w-44">
                  <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <select 
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                    className="w-full h-10 rounded-lg border border-surface-border dark:border-accent/10 bg-white dark:bg-surface-elevated px-9 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20 appearance-none cursor-pointer transition-all duration-200"
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="name-asc">Name A-Z</option>
                    <option value="name-desc">Name Z-A</option>
                  </select>
                </div>
              </div>
            </div>
            
            {!hasProjects ? (
              <div className="flex flex-col items-center justify-center py-20 px-4">
                <div className="max-w-md w-full bg-surface dark:bg-surface-elevated text-center py-12 px-8 rounded-xl border border-surface-border dark:border-accent/20 shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-stone-50 dark:bg-surface flex items-center justify-center mx-auto mb-6 border border-surface-border/50 dark:border-accent/10">
                    <Archive className="w-6 h-6 text-stone-400 dark:text-accent" />
                  </div>
                  <h2 className="text-xl font-bold text-primary mb-3">No vaults found</h2>
                  <p className="text-sm text-text-secondary mb-8 leading-relaxed">
                    Context Vault helps you maintain structured memory across AI tools. Create your first vault to get started.
                  </p>
                  <Button onClick={() => setIsModalOpen(true)} className="w-full gap-2 shadow-sm">
                    Create New Vault
                  </Button>
                </div>
              </div>
            ) : !hasFilteredProjects ? (
              <div className="flex flex-col items-center justify-center py-20 px-4">
                <div className="max-w-md w-full bg-surface dark:bg-surface-elevated text-center py-12 px-8 rounded-xl border border-surface-border dark:border-accent/20 shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-stone-50 dark:bg-surface flex items-center justify-center mx-auto mb-6 border border-surface-border/50 dark:border-accent/10">
                    <Search className="w-6 h-6 text-stone-400 dark:text-accent" />
                  </div>
                  <h2 className="text-xl font-bold text-primary mb-3">No matches found</h2>
                  <p className="text-sm text-text-secondary mb-8 leading-relaxed">
                    We couldn't find any vaults matching your search query. Try different keywords.
                  </p>
                  <Button onClick={() => setSearchQuery('')} variant="ghost" className="w-full gap-2">
                    Clear search
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredAndSortedProjects.map((project) => (
                  <motion.div variants={itemVariants} key={project.id}>
                    <FolderCard 
                      project={project}
                      onClick={() => navigate(`/project/${project.id}`)}
                      onDelete={(e) => handleDelete(project, e)}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
      
      {/* Create Project Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Vault"
        size="sm"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Vault Name"
            {...register('name')}
            error={errors.name?.message}
            placeholder="e.g. My SaaS App"
          />
          <Textarea
            label="Description (Optional)"
            {...register('description')}
            placeholder="What is this project about?"
            className="min-h-[100px]"
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={createMutation.isPending} className="">Create Vault</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      {projectToDelete && (
        <DeleteConfirmation
          isOpen={!!projectToDelete}
          onClose={() => setProjectToDelete(null)}
          onConfirm={() => deleteMutation.mutate(projectToDelete.id)}
          projectName={projectToDelete.name}
          isLoading={deleteMutation.isPending}
        />
      )}
    </AppLayout>
  );
};
