import axios from 'axios';
import api from '../../../service/api';
import { isLoginForbidden } from '../constants/authErrors';

export interface AuthUser {
  id: number;
  name: string | null;
  nickname: string | null;
  email: string;
  role: string;
  racketId?: number | null;
  racketUsages?: number;
  racketHistory?: RacketHistoryEntry[];
}

export interface RacketHistoryEntry {
  id: number;
  brand: string;
  name: string;
  description: string | null;
  pricePerDay: number;
  stock: number | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegistrationDetails extends LoginCredentials {
  name: string;
  nickname: string;
}

export interface UserUpdateDetails {
  name: string;
  nickname: string;
  email: string;
}

export type UpdatedUserDetails = UserUpdateDetails;

interface AuthResponse {
  status: 'SUCCESS' | 'FAILURE';
  message: string;
  error?: string;
}

const USER_STORAGE_KEY = 'yosoytupadel.auth-user';

function assertAuthSuccess(response: AuthResponse) {
  if (response.status !== 'SUCCESS') {
    throw new Error(response.error ?? response.message ?? 'No se pudo completar la autenticación.');
  }
}

function isAuthUser(value: unknown): value is AuthUser {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return typeof candidate.id === 'number'
    && (typeof candidate.name === 'string' || candidate.name === null)
    && (typeof candidate.nickname === 'string' || candidate.nickname === null)
    && typeof candidate.email === 'string'
    && typeof candidate.role === 'string'
    && (candidate.racketId === undefined || typeof candidate.racketId === 'number' || candidate.racketId === null)
    && (candidate.racketUsages === undefined || typeof candidate.racketUsages === 'number')
    && (candidate.racketHistory === undefined || (
      Array.isArray(candidate.racketHistory)
      && candidate.racketHistory.every((entry: unknown) => {
        if (typeof entry !== 'object' || entry === null) return false;
        const racket = entry as Record<string, unknown>;
        return typeof racket.id === 'number'
          && typeof racket.brand === 'string'
          && typeof racket.name === 'string'
          && (typeof racket.description === 'string' || racket.description === null)
          && typeof racket.pricePerDay === 'number'
          && (typeof racket.stock === 'number' || racket.stock === null);
      })
    ));
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthUser> {
    const { data } = await api.post<AuthResponse>('/api/v1/auth/login', credentials);
    assertAuthSuccess(data);
    return this.getCurrentUser();
  },

  async register(details: RegistrationDetails): Promise<void> {
    await api.post('/api/v1/users/new', {
      id: null,
      name: details.name.trim(),
      nickname: details.nickname.trim(),
      email: details.email.trim(),
      password: details.password,
      role: null,
      skillLevel: null,
      racketId: null,
      racketUsages: 0,
    });
  },

  async getCurrentUser(): Promise<AuthUser> {
    const { data } = await api.get<AuthUser>('/api/v1/users/me');
    return data;
  },

  async updateUser(id: number, details: UserUpdateDetails): Promise<UpdatedUserDetails> {
    const { data } = await api.put<UpdatedUserDetails>(`/api/v1/users/${id}`, details);
    return data;
  },

  async uploadUserImage(id: number, image: File): Promise<void> {
    const formData = new FormData();
    formData.append('imageFile', image);
    await api.put(`/api/v1/users/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  async deleteUser(id: number): Promise<void> {
    await api.delete(`/api/v1/users/${id}`);
  },

  async refresh(): Promise<void> {
    const { data } = await api.post<AuthResponse>('/api/v1/auth/refresh');
    assertAuthSuccess(data);
  },

  async logout(): Promise<void> {
    const { data } = await api.post<AuthResponse>('/api/v1/auth/logout');
    assertAuthSuccess(data);
  },

  readStoredUser(): AuthUser | null {
    const serializedUser = window.localStorage.getItem(USER_STORAGE_KEY);
    if (!serializedUser) {
      return null;
    }

    try {
      const user: unknown = JSON.parse(serializedUser);
      return isAuthUser(user) ? user : null;
    } catch {
      return null;
    }
  },

  storeUser(user: AuthUser | null) {
    if (user) {
      window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(USER_STORAGE_KEY);
    }
  },

  getErrorMessage(error: unknown): string {
    if (isLoginForbidden(error)) {
      return 'El correo o la contraseña son incorrectos.';
    }
    if (axios.isAxiosError<{ message?: string; error?: string }>(error)) {
      return error.response?.data?.message
        ?? error.response?.data?.error
        ?? 'No se pudo conectar con el servidor. Inténtalo de nuevo.';
    }
    return error instanceof Error ? error.message : 'Se ha producido un error inesperado.';
  },
};
