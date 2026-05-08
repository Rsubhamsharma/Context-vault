import { AIProvider, ContextUpdate } from '../ai-provider.interface';
import { SmartExportAIOutput } from '../../export/smart-export.schema';
import { ProjectContext } from '../../context/context.types';

export class MockAIProvider implements AIProvider {
  async extractContextUpdate(rawInput: string): Promise<ContextUpdate> {
    return {
      features_added: ['Mock Feature A', 'Mock Feature B'],
      features_removed: [],
      decisions_made: ['Mock Decision 1'],
      issues_found: ['Mock Issue X'],
      issues_resolved: ['Mock Issue Y'],
      dependencies_added: ['Mock Library 1.0'],
      constraints_added: [],
      next_steps: ['Complete Mock Task 1'],
    };
  }

  async extractSmartExportContext(task: string, fullContextJson: any): Promise<SmartExportAIOutput> {
    return {
      normalizedTask: task,
      taskCategory: 'general_continuation',
      taskIntent: 'Continue the project based on the provided task.',
      project_goal: (fullContextJson.project_goal || 'Mock Project Goal'),
      relevant_product_context: ['Mock Relevant Context 1'],
      relevant_tech_stack: ['Mock Tech 1'],
      relevant_existing_features: ['Mock Feature 1'],
      relevant_decisions: ['Mock Decision 1'],
      relevant_current_issues: ['Mock Issue 1'],
      relevant_resolved_issues: [],
      relevant_constraints: ['Do not rebuild from scratch'],
      do_not_change: ['Auth system'],
      continuation_instructions: ['Implement the task step by step'],
      excluded_summary: ['Unrelated UI details'],
      confidence: 'high',
    };
  }

  async cleanupContext(currentContext: ProjectContext): Promise<ProjectContext> {
    return {
      ...currentContext,
      features: currentContext.features.map(f => f.startsWith('Mock') ? 'Cleaned Mock Feature' : f),
      decisions: currentContext.decisions.slice(0, 5),
    };
  }
}
