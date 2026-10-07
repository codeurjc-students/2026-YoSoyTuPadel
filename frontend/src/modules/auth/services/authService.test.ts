import axios, { AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '../../../service/api';
import { authService } from './authService';

vi.mock('../../../service/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const user = {
  id: 7,
  name: 'Alex Smith',
  nickname: 'alex',
  email: 'alex@example.com',
  role: 'USER',
};

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logs in and retrieves the authenticated user', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { status: 'SUCCESS', message: 'Logged in' } });
    vi.mocked(api.get).mockResolvedValue({ data: user });

    await expect(authService.login({ email: user.email, password: 'secret' })).resolves.toEqual(user);

    expect(api.post).toHaveBeenCalledWith('/api/v1/auth/login', {
      email: user.email,
      password: 'secret',
    });
    expect(api.get).toHaveBeenCalledWith('/api/v1/users/me');
  });

  it('rejects an unsuccessful login response', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { status: 'FAILURE', message: 'Invalid credentials', error: 'Unauthorized' },
    });

    await expect(authService.login({ email: user.email, password: 'wrong' }))
      .rejects.toThrow('Unauthorized');
    expect(api.get).not.toHaveBeenCalled();
  });

  it('registers a user with the normalized request payload', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} });

    await expect(authService.register({
      name: ' Alex Smith ',
      nickname: ' alex ',
      email: ' alex@example.com ',
      password: 'secret',
    })).resolves.toBeUndefined();

    expect(api.post).toHaveBeenCalledWith('/api/v1/users/new', {
      id: null,
      name: 'Alex Smith',
      nickname: 'alex',
      email: 'alex@example.com',
      password: 'secret',
      role: null,
      skillLevel: null,
      racketId: null,
      racketUsages: 0,
    });
  });

  it('gets the current user successfully', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: user });

    await expect(authService.getCurrentUser()).resolves.toEqual(user);
    expect(api.get).toHaveBeenCalledWith('/api/v1/users/me');
  });

  it('propagates HTTP errors from the current user request', async () => {
    const error = new Error('Server failure');
    vi.mocked(api.get).mockRejectedValue(error);

    await expect(authService.getCurrentUser()).rejects.toBe(error);
  });

  it('logs out after a successful server response', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { status: 'SUCCESS', message: 'Logged out' } });

    await expect(authService.logout()).resolves.toBeUndefined();
    expect(api.post).toHaveBeenCalledWith('/api/v1/auth/logout');
  });

  it('maps unauthorized and server errors to user-facing messages', () => {
    const requestConfig: InternalAxiosRequestConfig = {
      headers: new AxiosHeaders(),
    };
    const unauthorizedError = new axios.AxiosError(
      'Unauthorized',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      { status: 401, statusText: 'Unauthorized', headers: {}, config: requestConfig, data: { message: 'Invalid credentials' } },
    );
    const serverError = new axios.AxiosError(
      'Server error',
      'ERR_BAD_RESPONSE',
      undefined,
      undefined,
      { status: 500, statusText: 'Internal Server Error', headers: {}, config: requestConfig, data: { error: 'Service unavailable' } },
    );

    expect(authService.getErrorMessage(unauthorizedError)).toBe('Invalid credentials');
    expect(authService.getErrorMessage(serverError)).toBe('Service unavailable');
  });
});
