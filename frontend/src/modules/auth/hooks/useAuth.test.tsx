import { renderHook, act, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../context/AuthProvider';
import { useAuth } from './useAuth';

const authServiceMocks = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  refresh: vi.fn(),
  getCurrentUser: vi.fn(),
  readStoredUser: vi.fn(() => null),
  storeUser: vi.fn(),
  getErrorMessage: vi.fn(() => 'Authentication failed'),
}));

vi.mock('../services/authService', () => ({
  authService: authServiceMocks,
}));

vi.mock('react-hot-toast', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );
}

const authenticatedUser = {
  id: 1,
  name: 'Alex Smith',
  nickname: 'alex',
  email: 'alex@example.com',
  role: 'USER',
};

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authServiceMocks.readStoredUser.mockReturnValue(null);
  });

  it('returns the initial unauthenticated state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('logs in and updates the authenticated state', async () => {
    authServiceMocks.login.mockResolvedValue(authenticatedUser);
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      await expect(result.current.login({ email: authenticatedUser.email, password: 'secret' }))
        .resolves.toBe(true);
    });

    expect(result.current.user).toEqual(authenticatedUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(authServiceMocks.storeUser).toHaveBeenCalledWith(authenticatedUser);
  });

  it('stores an error and returns false when login fails', async () => {
    authServiceMocks.login.mockRejectedValue(new Error('Invalid credentials'));
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      await expect(result.current.login({ email: authenticatedUser.email, password: 'wrong' }))
        .resolves.toBe(false);
    });

    expect(result.current.error).toBe('Authentication failed');
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('logs out and clears the authenticated state', async () => {
    authServiceMocks.readStoredUser.mockReturnValue(authenticatedUser);
    authServiceMocks.refresh.mockResolvedValue(undefined);
    authServiceMocks.getCurrentUser.mockResolvedValue(authenticatedUser);
    authServiceMocks.logout.mockResolvedValue(undefined);
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    await act(async () => {
      await expect(result.current.logout()).resolves.toBe(true);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(authServiceMocks.storeUser).toHaveBeenLastCalledWith(null);
  });

  it('throws when used without an AuthProvider', () => {
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth debe utilizarse dentro de AuthProvider.',
    );
  });
});
