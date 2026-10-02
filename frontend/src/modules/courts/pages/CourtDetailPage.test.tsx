import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import api from '../../../service/api';
import { AuthContext, type AuthContextValue } from '../../auth/context/authContext';
import Layout from '../../core/components/Layout';
import CourtDetailPage from './CourtDetailPage';

vi.mock('../../../service/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const signedInAuth: AuthContextValue = {
  user: { id: 9, name: 'Test', nickname: null, email: 'test@example.com', role: 'USER' },
  isAuthenticated: true,
  isLoading: false,
  error: null,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  clearError: vi.fn(),
};

function renderCourtDetail(auth: AuthContextValue = signedInAuth) {
  return render(
    <MemoryRouter initialEntries={['/courts/4']}>
      <AuthContext.Provider value={auth}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/courts/:id" element={<CourtDetailPage />} />
            <Route path="/courts" element={<h1>Catálogo de Pistas</h1>} />
            <Route path="/login" element={<h1>Inicia sesión</h1>} />
            <Route path="/bookings" element={<h1>Mis reservas</h1>} />
          </Route>
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

describe('CourtDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.get).mockImplementation((url: string) => Promise.resolve({
      data: url.includes('/availability') ? [] : {
        id: 4,
        name: 'Pista central',
        courtPrice: 8,
        type: 'INDOOR',
        surface: 'GLASS',
        isAvailable: true,
      },
    }));
  });

  test('redirects unauthenticated visitors to login', async () => {
    renderCourtDetail({ ...signedInAuth, user: null, isAuthenticated: false });

    expect(await screen.findByRole('heading', { name: 'Inicia sesión' })).toBeInTheDocument();
  });

  test('confirms a booking and shows a success summary before returning to courts', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { id: 12 } });
    renderCourtDetail();

    expect(await screen.findByRole('heading', { level: 1, name: 'Pista central' })).toBeInTheDocument();
    const today = new Date();
    const dateValue = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0'),
    ].join('-');
    await waitFor(() => expect(screen.getByRole('button', { name: '13:00' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: '13:00' }));
    fireEvent.click(screen.getByRole('button', { name: 'Finalizar reserva · 13:00' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(await screen.findByRole('heading', { name: '¡Reserva confirmada!' })).toBeInTheDocument();
    const [year, month, day] = dateValue.split('-').map(Number);
    const formattedDate = new Intl.DateTimeFormat('es-ES').format(new Date(year, month - 1, day));
    expect(screen.getAllByText(new RegExp(formattedDate))).toHaveLength(2);
    expect(screen.getAllByText('€8/h')).toHaveLength(2);
    expect(api.post).toHaveBeenCalledWith('/api/v1/bookings', {
      userId: 9,
      courtId: 4,
      bookingDate: dateValue,
      startTime: '13:00:00',
      endTime: '14:00:00',
      bookingPrice: null,
      type: 'MATCH',
      status: 'PENDING',
    });
    fireEvent.click(screen.getByRole('button', { name: 'Volver a pistas' }));
    expect(await screen.findByRole('heading', { name: 'Catálogo de Pistas' })).toBeInTheDocument();
  });

  test('shows a single Spanish error and disables the slot if the server reports it reserved', async () => {
    vi.mocked(api.post).mockRejectedValue({
      isAxiosError: true,
      response: { status: 409, data: { detail: 'The selected time slot is already reserved.' } },
    });
    renderCourtDetail();

    expect(await screen.findByRole('heading', { level: 1, name: 'Pista central' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: '13:00' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: '13:00' }));
    fireEvent.click(screen.getByRole('button', { name: 'Finalizar reserva · 13:00' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(await screen.findByText('Esta hora ya está reservada. Elige otra franja horaria.')).toBeInTheDocument();
    expect(screen.getAllByText('Esta hora ya está reservada. Elige otra franja horaria.')).toHaveLength(1);
    expect(await screen.findByRole('button', { name: '13:00, reservada' })).toBeDisabled();
  });

  test('marks time slots already returned by the availability API as unavailable', async () => {
    vi.mocked(api.get).mockImplementation((url: string) => Promise.resolve({
      data: url.includes('/availability') ? ['11:00'] : {
        id: 4,
        name: 'Pista central',
        courtPrice: 8,
        type: 'INDOOR',
        surface: 'GLASS',
        isAvailable: true,
      },
    }));
    renderCourtDetail();

    expect(await screen.findByRole('button', { name: '11:00, reservada' })).toBeDisabled();
  });

  test('disables time slots that have already passed today', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 2, 12, 30));
    const { unmount } = renderCourtDetail();

    try {
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
      });

      for (const time of ['09:00', '10:00', '11:00', '12:00']) {
        expect(screen.getByRole('button', { name: `${time}, no disponible` })).toBeDisabled();
      }
      expect(screen.getByRole('button', { name: '13:00' })).toBeEnabled();
    } finally {
      unmount();
      vi.useRealTimers();
    }
  });

  test('scrolls the date selector toward later days', async () => {
    renderCourtDetail();

    await screen.findByRole('heading', { level: 1, name: 'Pista central' });
    const nextDaysButton = screen.getByRole('button', { name: 'Días siguientes' });
    const dayScroller = nextDaysButton.parentElement?.children[1] as HTMLDivElement;

    fireEvent.click(nextDaysButton);

    expect(dayScroller.scrollLeft).toBe(220);
  });
});
