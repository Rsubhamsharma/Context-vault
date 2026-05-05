import { ContextUpdate } from './ai-provider.interface';
import { AIProviderFactory } from './ai-provider.factory';

export class AIService {
  async extractContext(input: string): Promise<ContextUpdate> {
    const provider = AIProviderFactory.getProvider();
    return provider.extractContextUpdate(input);
  }
}

export const aiService = new AIService();
