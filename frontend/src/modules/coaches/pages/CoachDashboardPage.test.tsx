import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '../../../service/api';
import { AuthContext, type AuthContextValue } from '../../auth/context/authContext';
import { authService } from '../../auth/services/authService';
import CoachDashboardPage from './CoachDashboardPage';

vi.mock('../../../service/api', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

vi.mock('../../auth/services/authService', () => ({
  authService: {
    getErrorMessage: vi.fn((error: unknown) => error instanceof Error ? error.message : 'Request failed'),
  },
}));

const coachAuth: AuthContextValue = {
  user: {
    id: 5,
    name: 'Coach User',
    nickname: 'coach',
    email: 'coach@example.com',
    role: 'COACH',
  },
  isAuthenticated: true,
  isLoading: false,
  error: null,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  clearError: vi.fn(),
};

const bookings = [
  {
    booking: {
      id: 11,
      bookingDate: '2099-06-15',
      startTime: '09:00:00',
      endTime: '10:00:00',
      bookingPrice: 35,
      status: 'PENDING' as const,
    },
    client: { id: 1, name: 'Alice Smith', nickname: 'alice' },
  },
  {
    booking: {
      id: 12,
      bookingDate: '2020-06-15',
      startTime: '12:00:00',
      endTime: '13:00:00',
      bookingPrice: null,
      status: 'COMPLETED' as const,
    },
    client: { id: 2, name: null, nickname: 'bob' },
  },
];

function renderDashboard(authValue: AuthContextValue = coachAuth) {
  return render(
    <AuthContext.Provider value={authValue}>
      <CoachDashboardPage />
    </AuthContext.Provider>,
  );
}

describe('CoachDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a loading indicator while bookings are being fetched', () => {
    vi.mocked(api.get).mockReturnValue(new Promise(() => undefined));

    renderDashboard();

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'PANEL DE ENTRENADOR' })).toBeInTheDocument();
  });

  it('renders pending and completed booking sections with client details', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: bookings });

    renderDashboard();

    expect(await screen.findByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('bob')).toBeInTheDocument();
    expect(screen.getByText('Reservas pendientes')).toBeInTheDocument();
    expect(screen.getByText('Reservas terminadas')).toBeInTheDocument();
    expect(screen.getByText('35.00 €')).toBeInTheDocument();
    expect(screen.getByText('0.00 €')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
    expect(screen.getByText('Terminada')).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith('/api/v1/bookings/coach', {
      signal: expect.any(AbortSignal),
    });
  });

  it('confirms a pending booking cancellation and marks it as cancelled', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: bookings });
    vi.mocked(api.patch).mockResolvedValue({});

    renderDashboard();

    fireEvent.click(await screen.findByRole('button', { name: 'Cancelar' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('¿Estás seguro de cancelar esta sesión?');

    fireEvent.click(screen.getByRole('button', { name: 'Sí, cancelar' }));

    await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/api/v1/bookings/11'));
    expect(await screen.findByText('Cancelada')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument();
  });

  it('closes the cancellation dialog without calling the API', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: bookings });

    renderDashboard();

    fireEvent.click(await screen.findByRole('button', { name: 'Cancelar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Volver' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(api.patch).not.toHaveBeenCalled();
  });

  it('shows the API error when loading bookings fails', async () => {
    const error = new Error('Unable to load bookings');
    vi.mocked(api.get).mockRejectedValue(error);

    renderDashboard();

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load bookings');
    expect(authService.getErrorMessage).toHaveBeenCalledWith(error);
  });

  it('shows the API error when cancellation fails', async () => {
    const error = new Error('Unable to cancel booking');
    vi.mocked(api.get).mockResolvedValue({ data: bookings });
    vi.mocked(api.patch).mockRejectedValue(error);

    renderDashboard();

    fireEvent.click(await screen.findByRole('button', { name: 'Cancelar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sí, cancelar' }));

    expect(await screen.findByText('Unable to cancel booking')).toBeInTheDocument();
    expect(authService.getErrorMessage).toHaveBeenCalledWith(error);
  });
});
