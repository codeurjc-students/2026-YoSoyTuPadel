import axios from 'axios';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { AuthContext, type AuthContextValue } from './authContext';
import {
  authService,
  type AuthUser,
  type LoginCredentials,
  type RegistrationDetails,
} from '../services/authService';
import { getWelcomeMessage } from '../utils/welcomeMessage';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => authService.readStoredUser());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialUser = useRef(user);

  useEffect(() => {
    if (!initialUser.current) {
      return;
    }

    let active = true;
    void authService.refresh()
      .then(() => authService.getCurrentUser())
      .then((currentUser) => {
        if (active) {
          setUser(currentUser);
          authService.storeUser(currentUser);
        }
      })
      .catch(() => {
        if (active) {
          setUser(null);
          authService.storeUser(null);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const authenticatedUser = await authService.login(credentials);
      setUser(authenticatedUser);
      authService.storeUser(authenticatedUser);
      toast.success(getWelcomeMessage(authenticatedUser.name));
      return true;
    } catch (authError) {
      const message = authService.getErrorMessage(authError);
      setError(message);
      if (!axios.isAxiosError(authError)) {
        toast.error(message);
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (details: RegistrationDetails) => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.register(details);
      toast.success('Cuenta creada. Ya puedes iniciar sesión.');
      return true;
    } catch (authError) {
      const message = authService.getErrorMessage(authError);
      setError(message);
      if (!axios.isAxiosError(authError)) {
        toast.error(message);
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.logout();
      setUser(null);
      authService.storeUser(null);
      toast.success('Has cerrado sesión.');
      return true;
    } catch (authError) {
      const message = authService.getErrorMessage(authError);
      setError(message);
      if (!axios.isAxiosError(authError)) {
        toast.error(message);
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    updateUser: setUser,
    isAuthenticated: user !== null,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
  }), [user, isLoading, error, login, register, logout, clearError]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
