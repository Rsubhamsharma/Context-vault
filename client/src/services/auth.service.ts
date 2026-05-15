import api from '../lib/api';
import type { AuthRequest, AuthResponse } from '../types/auth.types';
import type { ApiResponse } from '../types/context.types';

export const authService = {
  async login(data: AuthRequest): Promise<AuthResponse> {
    const response = await api.post('/auth/login', data);
    return response.data;
  },
  async register(data: AuthRequest): Promise<AuthResponse> {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
  async getMe(): Promise<ApiResponse<{
    id: string;
    email: string;
    onboardingCompleted: boolean;
    onboardingCompletedAt: string | null;
  }>> {
    const response = await api.get('/auth/me');
    return response.data;
  },
  async updateOnboarding(completed: boolean): Promise<ApiResponse<{
    id: string;
    onboardingCompleted: boolean;
    onboardingCompletedAt: string | null;
  }>> {
    const response = await api.patch('/auth/me/onboarding', { onboardingCompleted: completed });
    return response.data;
  },
};
