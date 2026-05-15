import rateLimit from 'express-rate-limit';
import { Response } from 'express';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Strict limit for auth routes
  message: { success: false, message: 'Too many authentication attempts, please try again later.', code: 'TOO_MANY_AUTH_ATTEMPTS' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit for AI-heavy operations
  message: { success: false, message: 'AI request limit reached. Please try again later.', code: 'AI_LIMIT_REACHED' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const githubLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit for GitHub integration routes
  message: { success: false, message: 'Too many GitHub API requests, please try again later.', code: 'GITHUB_LIMIT_REACHED' },
  standardHeaders: true,
  legacyHeaders: false,
});
