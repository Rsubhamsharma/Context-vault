import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().transform(Number),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  AI_PROVIDER: z.enum(['mock', 'gemini']).default('mock'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL_PRIMARY: z.string().optional(),
  GEMINI_MODEL_FALLBACK: z.string().optional(),
  FRONTEND_URL: z.string().url().optional(),
  ALLOWED_ORIGINS: z.string().optional(),
  GITHUB_APP_ID: z.string().optional(),
  GITHUB_APP_SLUG: z.string().optional(),
  GITHUB_PRIVATE_KEY: z.string().optional(),
  GITHUB_CALLBACK_URL: z.string().url().optional(),
}).refine((data) => {
  if (data.AI_PROVIDER === 'gemini') {
    if (!data.GEMINI_API_KEY) return false;
    if (!data.GEMINI_MODEL_PRIMARY) return false;
  }
  return true;
}, {
  message: 'GEMINI_API_KEY and GEMINI_MODEL_PRIMARY are required when AI_PROVIDER is set to gemini',
  path: ['GEMINI_API_KEY'],
});

export const env = envSchema.parse(process.env);
