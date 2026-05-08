import { GoogleGenAI } from '@google/genai';
import { AIProvider, ContextUpdate } from '../ai-provider.interface';
import { SmartExportAIOutput } from '../../export/smart-export.schema';
import { env } from '../../../config/env';
import { AppError } from '../../../middleware/error.middleware';
import { AI_PROMPTS } from '../ai.prompts';
import { contextUpdateSchema } from '../../context/context.schema';
import { smartExportSchema } from '../../export/smart-export.schema';
import { ProjectContext } from '../../context/context.types';
import { projectContextSchema } from '../../context/context.schema';
import { logger } from '../../../utils/logger';
import { normalizeAIResponse } from '../ai-response-normalizer';

export class GeminiProvider implements AIProvider {
  private ai: GoogleGenAI;

  constructor() {
    if (!env.GEMINI_API_KEY) {
      throw new AppError(500, 'Gemini API key is not configured');
    }
    this.ai = new GoogleGenAI({
      apiKey: env.GEMINI_API_KEY,
    });
  }

  private async repairResponse(model: string, rawInput: string, aiOutput: string): Promise<ContextUpdate> {
    const prompt = AI_PROMPTS.buildRepairPrompt(rawInput, aiOutput);
    
    const response = await this.ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text;
    if (!text) {
      throw new AppError(422, 'AI response could not be repaired into valid context update');
    }

    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      throw new AppError(422, 'AI response could not be repaired into valid context update');
    }

    const normalized = normalizeAIResponse(json);
    const validation = contextUpdateSchema.safeParse(normalized);
    
    if (!validation.success) {
      throw new AppError(422, 'AI response could not be repaired into valid context update');
    }

    return validation.data;
  }

  private async executeWithRetry(model: string, rawInput: string, attempt: number = 0): Promise<ContextUpdate> {
    try {
      const prompt = AI_PROMPTS.EXTRACT_CONTEXT.replace('{{input}}', rawInput);
      
      const response = await this.ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const text = response.text;

      if (!text) {
        throw new AppError(500, 'Gemini returned an empty response');
      }

      let json;
      try {
        json = JSON.parse(text);
      } catch (e) {
        // Try to repair if JSON parsing fails
        return await this.repairResponse(model, rawInput, text);
      }

      const normalized = normalizeAIResponse(json);
      const validation = contextUpdateSchema.safeParse(normalized);

      if (!validation.success) {
        if (env.NODE_ENV === 'development') {
          logger.error('Gemini response failed schema validation', {
            errors: validation.error.format(),
            received: normalized,
          });
        }
        // Try to repair if schema validation fails
        return await this.repairResponse(model, rawInput, text);
      }

      return validation.data;
    } catch (error) {
      if (error instanceof AppError && error.statusCode === 422) throw error;
      if (error instanceof AppError) throw error;

      const status = (error as any)?.status || (error as any)?.response?.status;
      const transientStatuses = [429, 500, 502, 503, 504];

      // Reduce retries and delay to improve UI response time
      if (transientStatuses.includes(status) && attempt < 1) {
        const delay = 500; 
        if (env.NODE_ENV === 'development') {
          logger.info(`Gemini transient error ${status}. Retrying in ${delay}ms...`);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.executeWithRetry(model, rawInput, attempt + 1);
      }

      if (transientStatuses.includes(status)) {
        throw new AppError(503, 'AI extraction is temporarily unavailable due to high demand');
      }

      throw new AppError(500, `Gemini API Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async extractContextUpdate(rawInput: string): Promise<ContextUpdate> {
    try {
      return await this.executeWithRetry(env.GEMINI_MODEL_PRIMARY!, rawInput);
    } catch (error) {
      const isTransient = error instanceof AppError && (error.statusCode === 503 || error.statusCode === 429);
      if (isTransient && env.GEMINI_MODEL_FALLBACK) {
        if (env.NODE_ENV === 'development') {
          logger.info('Primary Gemini model failed. Trying fallback model...');
        }
        try {
          return await this.executeWithRetry(env.GEMINI_MODEL_FALLBACK, rawInput);
        } catch (fallbackError) {
          if (fallbackError instanceof AppError) throw fallbackError;
          throw new AppError(500, `Fallback Gemini API Error: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
        }
      }
      if (error instanceof AppError) throw error;
      throw new AppError(500, `Gemini Provider Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async extractSmartExportContext(task: string, fullContextJson: any): Promise<SmartExportAIOutput> {
    const prompt = AI_PROMPTS.SMART_EXPORT(task, JSON.stringify(fullContextJson, null, 2));
    
    const response = await this.ai.models.generateContent({
      model: env.GEMINI_MODEL_PRIMARY!,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text;
    if (!text) {
      throw new AppError(500, 'Gemini returned an empty response for smart export');
    }

    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      throw new AppError(422, 'Smart export response is not valid JSON');
    }

    const validation = smartExportSchema.safeParse(json);
    if (!validation.success) {
      throw new AppError(422, 'Smart export response failed schema validation');
    }

    return validation.data;
  }

  async cleanupContext(currentContext: ProjectContext): Promise<ProjectContext> {
    const prompt = AI_PROMPTS.CLEANUP_CONTEXT(JSON.stringify(currentContext, null, 2));
    
    const response = await this.ai.models.generateContent({
      model: env.GEMINI_MODEL_PRIMARY!,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text;
    if (!text) {
      throw new AppError(500, 'Gemini returned an empty response for context cleanup');
    }

    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      throw new AppError(422, 'Cleanup response is not valid JSON');
    }

    const validation = projectContextSchema.safeParse(json);
    if (!validation.success) {
      throw new AppError(422, 'Cleanup response failed schema validation');
    }

    return validation.data;
  }
}
