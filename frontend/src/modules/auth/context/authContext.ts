import { createContext } from 'react';
import type { AuthUser, LoginCredentials, RegistrationDetails } from '../services/authService.ts';

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (details: RegistrationDetails) => Promise<boolean>;
  logout: () => Promise<boolean>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
