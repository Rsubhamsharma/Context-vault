import { ContextUpdate } from '../context/context.types';
import { SmartExportAIOutput } from '../export/smart-export.schema';
import { ProjectContext } from '../context/context.types';

export type { ContextUpdate };

export interface AIProvider {
  extractContextUpdate(rawInput: string): Promise<ContextUpdate>;
  extractSmartExportContext(task: string, fullContextJson: any): Promise<SmartExportAIOutput>;
  cleanupContext(currentContext: ProjectContext): Promise<ProjectContext>;
}
