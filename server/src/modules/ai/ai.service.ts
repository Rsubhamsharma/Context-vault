import { ContextUpdate } from './ai-provider.interface';
import { AIProviderFactory } from './ai-provider.factory';
import { SmartExportAIOutput } from '../export/smart-export.schema';
import { ProjectContext } from '../context/context.types';

export class AIService {
  async extractContext(input: string): Promise<ContextUpdate> {
    const provider = AIProviderFactory.getProvider();
    return provider.extractContextUpdate(input);
  }

  async getSmartExportContext(task: string, fullContextJson: any): Promise<SmartExportAIOutput> {
    const provider = AIProviderFactory.getProvider();
    return provider.extractSmartExportContext(task, fullContextJson);
  }

  async cleanupContext(currentContext: ProjectContext): Promise<ProjectContext> {
    const provider = AIProviderFactory.getProvider();
    return provider.cleanupContext(currentContext);
  }
}

export const aiService = new AIService();
