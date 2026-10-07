import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from '../../auth/context/authContext';
import { courtService, type CourtPage } from '../services/courtService';
import CourtListPage from './CourtListPage';

vi.mock('../services/courtService', () => ({
  courtService: {
    getCourts: vi.fn(),
  },
}));

const getCourtsMock = vi.mocked(courtService.getCourts);

const successfulResponse: CourtPage = {
  content: [
    { id: 1, name: 'Central court', isAvailable: true },
    { id: 2, name: 'Training court', isAvailable: false },
  ],
  number: 0,
  size: 10,
  totalElements: 2,
  totalPages: 1,
  last: true,
};

const authenticatedUser = {
  id: 7,
  name: 'Test user',
  nickname: 'test-user',
  email: 'user@example.com',
  role: 'USER',
};

const adminUser = {
  ...authenticatedUser,
  role: 'ADMIN',
};

const defaultAuth: AuthContextValue = {
  user: authenticatedUser,
  isAuthenticated: true,
  isLoading: false,
  error: null,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  clearError: vi.fn(),
};

function renderCourtList(authValue: AuthContextValue = defaultAuth) {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={authValue}>
        <CourtListPage />
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

describe('CourtListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the loading skeleton while courts are being fetched', () => {
    getCourtsMock.mockReturnValue(new Promise(() => undefined));

    renderCourtList();

    expect(screen.getByRole('status', { name: 'Cargando pistas' })).toBeInTheDocument();
  });

  it('renders an error message when loading courts fails', async () => {
    getCourtsMock.mockRejectedValue(new Error('Request failed'));

    renderCourtList();

    expect(await screen.findByText('No se han podido cargar las pistas.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });

  it('renders court cards with their names and availability states', async () => {
    getCourtsMock.mockResolvedValue(successfulResponse);

    renderCourtList();

    expect(await screen.findByRole('heading', { name: 'Central court' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Training court' })).toBeInTheDocument();
    expect(screen.getByText('Disponible')).toBeInTheDocument();
    expect(screen.getByText('No disponible')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Ver disponibilidad' })).toHaveLength(2);
  });

  it('disables details for unavailable courts for regular users', async () => {
    getCourtsMock.mockResolvedValue(successfulResponse);

    renderCourtList();

    const detailsButtons = await screen.findAllByRole('link', { name: 'Ver disponibilidad' });

    expect(detailsButtons[1]).toHaveAttribute('aria-disabled', 'true');
  });

  it('keeps details enabled for unavailable courts for administrators', async () => {
    getCourtsMock.mockResolvedValue(successfulResponse);

    renderCourtList({ ...defaultAuth, user: adminUser });

    const detailsButtons = await screen.findAllByRole('link', { name: 'Ver detalles' });
    const unavailableCourtDetails = detailsButtons[1];

    expect(unavailableCourtDetails).not.toHaveAttribute('aria-disabled', 'true');
    expect(unavailableCourtDetails).toHaveAttribute('href', '/courts/2');
  });
});
