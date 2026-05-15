import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { registerSchema, loginSchema } from './auth.schema';
import { sendResponse } from '../../utils/response';
import { AuthRequest } from '../../middleware/auth.middleware';
import { AppError } from '../../middleware/error.middleware';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = registerSchema.parse(req.body);
      const user = await authService.register(validatedData);
      return sendResponse(res, 201, user, 'User registered successfully');
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = loginSchema.parse(req.body);
      const result = await authService.login(validatedData);
      return sendResponse(res, 200, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await authService.getMe(req.user!.id);
      return sendResponse(res, 200, user, 'User profile retrieved');
    } catch (error) {
      next(error);
    }
  }

  async updateOnboarding(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { onboardingCompleted } = req.body;
      if (typeof onboardingCompleted !== 'boolean') {
        throw new AppError(400, 'onboardingCompleted must be a boolean');
      }
      const user = await authService.updateOnboardingStatus(req.user!.id, onboardingCompleted);
      return sendResponse(res, 200, user, 'Onboarding status updated');
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
