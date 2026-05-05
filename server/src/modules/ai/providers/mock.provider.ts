import { AIProvider, ContextUpdate } from '../ai-provider.interface';

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
}
