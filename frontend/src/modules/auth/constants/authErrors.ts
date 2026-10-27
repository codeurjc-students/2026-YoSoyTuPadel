import axios from 'axios';

export function isLoginForbidden(error: unknown): boolean {
  return axios.isAxiosError(error)
    && error.response?.status === 403
    && error.config?.url?.includes('/api/v1/auth/login') === true;
}

export function isLoginAuthenticationError(error: unknown): boolean {
  return axios.isAxiosError(error)
    && (error.response?.status === 401 || error.response?.status === 403)
    && error.config?.url?.includes('/api/v1/auth/login') === true;
}
