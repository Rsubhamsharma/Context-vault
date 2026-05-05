
export interface User {
  id: string;
  email: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    token: string;
    user: User;
  };
  message?: string;
}

export interface AuthRequest {
  email: string;
  password: string;
}
