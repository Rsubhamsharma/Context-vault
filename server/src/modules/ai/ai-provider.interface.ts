import { ContextUpdate } from '../context/context.types';

export type { ContextUpdate };

export interface AIProvider {
  extractContextUpdate(rawInput: string): Promise<ContextUpdate>;
}
