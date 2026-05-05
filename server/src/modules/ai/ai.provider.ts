import { ContextUpdate } from '../context/context.types';

export interface AIProvider {
  extractContextUpdate(rawInput: string): Promise<ContextUpdate>;
}

export class MockAIProvider implements AIProvider {
  async extractContextUpdate(rawInput: string): Promise<ContextUpdate> {
    // Simulate AI processing time
    await new Promise((resolve) => setTimeout(resolve, 500));
 
    return {
      features_added: ['Mock Feature 1', 'Mock Feature 2'],
      features_removed: [],
      decisions_made: ['Mock Decision 1'],
      issues_found: ['Mock Issue 1'],
      issues_resolved: [],
      dependencies_added: ['Mock Dep 1'],
      constraints_added: ['Mock Constraint 1'],
      next_steps: ['Mock Next Step 1'],
    };
  }
}
