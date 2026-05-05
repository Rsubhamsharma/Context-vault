import { AIProvider } from './ai-provider.interface';
import { MockAIProvider } from './providers/mock.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { env } from '../../config/env';

export class AIProviderFactory {
  static getProvider(): AIProvider {
    switch (env.AI_PROVIDER) {
      case 'gemini':
        return new GeminiProvider();
      case 'mock':
      default:
        return new MockAIProvider();
    }
  }
}
