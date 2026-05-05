import api from '../lib/api';
import type { AuthRequest, AuthResponse } from '../types/auth.types';

export const authService = {
  async login(data: AuthRequest): Promise<AuthResponse> {
    const response = await api.post('/auth/login', data);
    return response.data;
  },
  async register(data: AuthRequest): Promise<AuthResponse> {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
};
