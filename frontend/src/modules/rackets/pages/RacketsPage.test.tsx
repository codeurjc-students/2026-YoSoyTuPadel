import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from '../../auth/context/authContext';
import { racketService, type RacketPage } from '../services/racketService';
import RacketsPage from './RacketsPage';

vi.mock('../services/racketService', () => ({
  racketService: {
    getRackets: vi.fn(),
  },
}));

const catalogue: RacketPage = {
  content: [
    { id: 1, brand: 'Bullpadel', name: 'Vertex 04', stock: 2 },
    { id: 2, brand: 'Head', name: 'Alpha Motion', stock: 0 },
  ],
  number: 0,
  size: 10,
  totalElements: 2,
  totalPages: 1,
  last: true,
};

const userAuth: AuthContextValue = {
  user: {
    id: 1,
    name: 'Test user',
    nickname: 'test-user',
    email: 'test@example.com',
    role: 'USER',
  },
  isAuthenticated: true,
  isLoading: false,
  error: null,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  clearError: vi.fn(),
};

function renderCatalogue() {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={userAuth}>
        <RacketsPage />
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

describe('RacketsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders racket cards with their titles and availability states', async () => {
    vi.mocked(racketService.getRackets).mockResolvedValue(catalogue);

    renderCatalogue();

    expect(await screen.findByRole('heading', { name: 'Bullpadel - Vertex 04' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Head - Alpha Motion' })).toBeInTheDocument();
    expect(screen.getByText('2 palas disponibles')).toBeInTheDocument();
    expect(screen.getByText('Agotada')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver detalles de Bullpadel Vertex 04' }))
      .toHaveAttribute('href', '/rackets/1');
  });

  it('renders the loading skeleton while the catalogue request is pending', () => {
    vi.mocked(racketService.getRackets).mockReturnValue(new Promise(() => undefined));

    renderCatalogue();

    expect(screen.getByRole('status', { name: 'Cargando palas' })).toBeInTheDocument();
  });
});
