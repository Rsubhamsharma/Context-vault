import type { User } from '../types/auth.types';

export const auth = {
  setToken: (token: string) => localStorage.setItem('auth_token', token),
  getToken: () => localStorage.getItem('auth_token'),
  setUser: (user: User) => localStorage.setItem('user', JSON.stringify(user)),
  getUser: (): User | null => {
    const raw = localStorage.getItem('user');
    if (!raw || raw === 'undefined') return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },
  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  },
  isAuthenticated: () => !!localStorage.getItem('auth_token'),
};
