import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '../../../service/api';
import { authService } from '../../auth/services/authService';
import { courtService } from '../../courts/services/courtService';
import AdminDashboardPage from './AdminDashboardPage';

vi.mock('../../../service/api', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../auth/services/authService', () => ({
  authService: {
    updateUser: vi.fn(),
    getErrorMessage: vi.fn(() => 'Administration request failed'),
  },
}));

vi.mock('../../courts/services/courtService', () => ({
  courtService: {
    getCourtById: vi.fn(),
  },
}));

const users = [
  {
    id: 1,
    name: 'Client One',
    nickname: 'client',
    email: 'client@example.com',
    role: 'USER',
    sessionPrice: null,
  },
  {
    id: 2,
    name: 'Coach One',
    nickname: 'coach',
    email: 'coach@example.com',
    role: 'ROLE_COACH',
    sessionPrice: 35,
  },
];

function mockDashboardRequests() {
  vi.mocked(api.get)
    .mockResolvedValueOnce({ data: users })
    .mockResolvedValueOnce({ data: [] })
    .mockResolvedValueOnce({ data: users });
}

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the administration dashboard and user management tabs', async () => {
    mockDashboardRequests();

    render(<AdminDashboardPage />);

    expect(await screen.findByRole('heading', { name: 'PANEL DE ADMINISTRACIÓN' })).toBeInTheDocument();
    expect(screen.getByText('Client One')).toBeInTheDocument();
    expect(screen.getByText('Cliente')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Clientes (1)' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Entrenadores (1)' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Reservas' })).toBeInTheDocument();
  });

  it('renders coaches when the coach management tab is selected', async () => {
    mockDashboardRequests();

    render(<AdminDashboardPage />);

    fireEvent.click(await screen.findByRole('tab', { name: 'Entrenadores (1)' }));

    expect(screen.getByText('Coach One')).toBeInTheDocument();
    expect(screen.getByText('Entrenador')).toBeInTheDocument();
  });

  it('edits a user only after changing data and confirming the action', async () => {
    mockDashboardRequests();
    vi.mocked(authService.updateUser).mockResolvedValue({
      name: 'Updated Client',
      nickname: 'client',
      email: 'client@example.com',
      sessionPrice: null,
    });

    render(<AdminDashboardPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Modificar' }));
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled();

    fireEvent.change(screen.getByRole('textbox', { name: 'Nombre' }), {
      target: { value: 'Updated Client' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    await waitFor(() => expect(authService.updateUser).toHaveBeenCalledWith(1, {
      name: 'Updated Client',
      nickname: 'client',
      email: 'client@example.com',
      sessionPrice: null,
    }));
    expect(await screen.findByText('Usuario modificado con éxito.')).toBeInTheDocument();
  });

  it('deletes a user after confirmation', async () => {
    mockDashboardRequests();
    vi.mocked(api.delete).mockResolvedValue({});

    render(<AdminDashboardPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Eliminar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/api/v1/users/1'));
    expect(await screen.findByText('Usuario eliminado con éxito.')).toBeInTheDocument();
    expect(screen.queryByText('Client One')).not.toBeInTheDocument();
  });

  it('renders booking management data and supports cancellation', async () => {
    const booking = {
      id: 21,
      bookingDate: '2099-06-15',
      startTime: '10:00:00',
      endTime: '11:00:00',
      bookingPrice: 20,
      type: 'MATCH' as const,
      status: 'PENDING' as const,
      userId: 1,
      courtId: 4,
      coachId: null,
    };
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: users })
      .mockResolvedValueOnce({ data: [booking] })
      .mockResolvedValueOnce({ data: users });
    vi.mocked(courtService.getCourtById).mockResolvedValue({
      id: 4,
      name: 'Central court',
      courtPrice: 15,
      type: 'INDOOR',
      surface: 'GLASS',
      isAvailable: true,
    });
    vi.mocked(api.patch).mockResolvedValue({});

    render(<AdminDashboardPage />);
    fireEvent.click(await screen.findByRole('tab', { name: 'Reservas' }));

    expect(await screen.findByText('Pista: Central court')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/api/v1/bookings/21'));
    expect(await screen.findByText('Reserva cancelada con éxito.')).toBeInTheDocument();
  });
});
