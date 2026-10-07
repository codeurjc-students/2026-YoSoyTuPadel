import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import api from '../../../service/api';
import { AuthContext, type AuthContextValue } from '../../auth/context/authContext';
import CoachListPage from './CoachListPage';

vi.mock('../../../service/api', () => ({
  default: {
    get: vi.fn(),
    getUri: vi.fn(({ url }: { url: string }) => url),
    post: vi.fn(),
  },
}));

const guestAuth: AuthContextValue = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  clearError: vi.fn(),
};

function renderList() {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={guestAuth}>
        <CoachListPage />
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

describe('CoachListPage', () => {
  beforeEach(() => vi.clearAllMocks());

  test('shows coaches and login CTA for guests with the total count', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        content: [{ id: 1, name: 'Juan Pérez', skillLevel: 1, sessionPrice: 35 }],
        number: 0,
        size: 10,
        totalElements: 14,
        totalPages: 2,
        last: false,
      },
    });

    renderList();

    expect(await screen.findByRole('heading', { name: 'Juan Pérez' })).toBeInTheDocument();
    expect(screen.getByText('14 entrenadores disponibles')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'CERTIFICADOS POR LA FEP' })).toBeInTheDocument();
    expect(screen.getByText('Nivel 1')).toBeInTheDocument();
    expect(screen.getByText('Nivel 2')).toBeInTheDocument();
    expect(screen.getByText('Nivel 3')).toBeInTheDocument();
    expect(screen.getByText('FEP Nivel 1')).toBeInTheDocument();
    expect(screen.queryByText('Precio por sesión')).not.toBeInTheDocument();
    expect(screen.queryByText('€35/sesión')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Entrenamiento de pádel con Juan Pérez' })).toHaveAttribute(
      'src',
      '/api/v1/users/coaches/1/image',
    );
    expect(screen.getByRole('link', { name: 'Inicia sesión para reservar' })).toHaveAttribute('href', '/login');
    expect(api.get).toHaveBeenCalledWith('/api/v1/users/coaches', {
      params: { page: 0, size: 10 },
      signal: expect.any(AbortSignal),
    });
  });

  test('appends the next coach page', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({
        data: {
          content: Array.from({ length: 10 }, (_, index) => ({
            id: index + 1,
            name: `Coach ${index + 1}`,
            skillLevel: (index % 3) + 1,
            sessionPrice: 30,
          })),
          number: 0,
          size: 10,
          totalElements: 11,
          totalPages: 2,
          last: false,
        },
      })
      .mockResolvedValueOnce({
        data: {
          content: [{ id: 11, name: 'Coach 11', skillLevel: 2, sessionPrice: 35 }],
          number: 1,
          size: 10,
          totalElements: 11,
          totalPages: 2,
          last: true,
        },
      });

    renderList();
    expect(await screen.findByRole('heading', { name: 'Coach 10' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Más resultados' }));

    expect(await screen.findByRole('heading', { name: 'Coach 11' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Más resultados' })).not.toBeInTheDocument();
  });
});
