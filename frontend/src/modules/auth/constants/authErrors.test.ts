import axios, { type InternalAxiosRequestConfig } from 'axios';
import { describe, expect, test } from 'vitest';
import { isLoginForbidden } from './authErrors.ts';

describe('isLoginForbidden', () => {
  test('identifies forbidden responses from login endpoint', () => {
    const config = { url: '/api/v1/auth/login' } as InternalAxiosRequestConfig;
    const error = new axios.AxiosError('Request failed', 'ERR_BAD_REQUEST', config);
    error.response = {
      data: 'Forbidden',
      status: 403,
      statusText: 'Forbidden',
      headers: {},
      config,
    };

    expect(isLoginForbidden(error)).toBe(true);
  });

  test('does not treat forbidden responses from other endpoints as bad credentials', () => {
    const config = { url: '/api/v1/users/me' } as InternalAxiosRequestConfig;
    const error = new axios.AxiosError('Request failed', 'ERR_BAD_REQUEST', config);
    error.response = {
      data: 'Forbidden',
      status: 403,
      statusText: 'Forbidden',
      headers: {},
      config,
    };

    expect(isLoginForbidden(error)).toBe(false);
  });
});
