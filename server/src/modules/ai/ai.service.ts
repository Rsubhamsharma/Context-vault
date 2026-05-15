import { ContextUpdate } from './ai-provider.interface';
import { AIProviderFactory } from './ai-provider.factory';
import { SmartExportAIOutput } from '../export/smart-export.schema';
import { ProjectContext } from '../context/context.types';
import { AI_PROMPTS } from './ai.prompts';
import { PreprocessingMetadata } from '../../services/git-preprocess.service';

export class AIService {
  async extractContext(input: string): Promise<ContextUpdate> {
    const provider = AIProviderFactory.getProvider();
    return provider.extractContextUpdate(input);
  }

  async analyzeGitChanges(gitData: { 
    title?: string, 
    changeType: string, 
    branch?: string, 
    baseBranch?: string, 
    changeText: string,
    preprocessingMetadata?: PreprocessingMetadata
  }): Promise<ContextUpdate> {
    const provider = AIProviderFactory.getProvider();
    const prompt = AI_PROMPTS.GIT_CHANGE_ANALYSIS(gitData);
    return provider.extractContextUpdate(prompt);
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
