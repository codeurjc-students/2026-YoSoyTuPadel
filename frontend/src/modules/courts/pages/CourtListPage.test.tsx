import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import api from '../../../service/api';
import { AuthContext, type AuthContextValue } from '../../auth/context/authContext';
import CourtListPage from './CourtListPage';

vi.mock('../../../service/api', () => ({
  default: {
    get: vi.fn(),
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
        <CourtListPage />
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

describe('CourtListPage', () => {
  beforeEach(() => vi.clearAllMocks());

  test('shows public courts and offers login to visitors', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        content: [{
          id: 1,
          name: 'Pista central',
          isAvailable: true,
        }],
        number: 0,
        size: 10,
        totalElements: 1,
        totalPages: 1,
        last: true,
      },
    });

    renderList();

    expect(await screen.findByRole('heading', { name: 'Pista central' })).toBeInTheDocument();
    expect(screen.getByText('1 pista')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Vista de una pista de pádel - Pista central' }))
      .toHaveAttribute('src', '/images/padel-court-overhead.jpg');
    expect(screen.getByRole('link', { name: /Volver al inicio/ })).toHaveAttribute('href', '/');
    expect(screen.queryByText('€24/h')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Inicia sesión para reservar' })).toHaveAttribute('href', '/login');
    expect(api.get).toHaveBeenCalledWith('/api/v1/courts', {
      params: { page: 0, size: 10 },
      signal: expect.any(AbortSignal),
    });
  });

  test('loads and appends the next page', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({
        data: {
          content: Array.from({ length: 10 }, (_, index) => ({
            id: index + 1,
            name: `Pista ${index + 1}`,
            isAvailable: true,
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
          content: [{ id: 11, name: 'Pista 11', isAvailable: true }],
          number: 1,
          size: 10,
          totalElements: 11,
          totalPages: 2,
          last: true,
        },
      });

    renderList();

    expect(await screen.findByRole('heading', { name: 'Pista 10' })).toBeInTheDocument();
    expect(screen.getByText('11 pistas')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Más resultados' }));
    expect(await screen.findByRole('heading', { name: 'Pista 11' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Más resultados' })).not.toBeInTheDocument();
    expect(api.get).toHaveBeenNthCalledWith(2, '/api/v1/courts', {
      params: { page: 1, size: 10 },
      signal: undefined,
    });
  });
});
