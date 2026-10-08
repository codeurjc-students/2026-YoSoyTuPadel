import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from '../auth/context/authContext';
import { bookingService, type BookingItem } from './services/bookingService';
import MyBookingsPage from './pages/MyBookingsPage';

vi.mock('./services/bookingService', () => ({
  bookingService: {
    getUserBookings: vi.fn(),
    cancelBooking: vi.fn(),
    toRacketHistoryItems: vi.fn(() => []),
  },
}));

const auth: AuthContextValue = {
  user: { id: 12, name: 'Ana', nickname: 'ana', email: 'ana@example.com', role: 'USER' },
  isAuthenticated: true,
  isLoading: false,
  error: null,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  clearError: vi.fn(),
};

const bookings: BookingItem[] = [
  {
    id: 'court-12',
    type: 'court',
    title: 'Pista central',
    date: '2099-06-15',
    time: '10:00',
    price: 20,
    image: '/images/padel-court-overhead.jpg',
    status: 'PENDING',
  },
  {
    id: 'coach-12',
    type: 'coach',
    title: 'María López',
    date: '2099-06-16',
    time: '12:00',
    price: 35,
    image: '/images/coach-training.jpg',
    status: 'COMPLETED',
  },
];

function renderBookings(value: AuthContextValue = auth) {
  return render(
    <MemoryRouter initialEntries={['/bookings']}>
      <AuthContext.Provider value={value}>
        <Routes>
          <Route path="/bookings" element={<MyBookingsPage />} />
          <Route path="/courts" element={<h1>Catálogo de pistas</h1>} />
          <Route path="/login" element={<h1>Inicia sesión</h1>} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

describe('Integración de reservas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(bookingService.getUserBookings).mockResolvedValue(bookings);
  });

  test('obtiene las reservas y las filtra por categoría', async () => {
    renderBookings();

    expect(await screen.findByRole('heading', { name: 'Pista central' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'María López' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Entrenamientos' }));

    expect(screen.getByRole('heading', { name: 'María López' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Pista central' })).not.toBeInTheDocument();
    expect(bookingService.getUserBookings).toHaveBeenCalledWith(12, expect.any(AbortSignal));
  });

  test('cancela una reserva y actualiza la vista sin recargar', async () => {
    vi.mocked(bookingService.cancelBooking).mockResolvedValue();
    renderBookings();

    fireEvent.click(await screen.findByRole('button', { name: 'Cancelar reserva' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar cancelación' }));

    await waitFor(() => expect(bookingService.cancelBooking).toHaveBeenCalledWith('court-12', 'court'));
    expect(await screen.findByText('Reserva cancelada con éxito')).toBeInTheDocument();
    expect(screen.getByText('Cancelada')).toBeInTheDocument();
  });

  test('muestra el acceso de autenticación cuando el visitante intenta ver reservas', async () => {
    renderBookings({ ...auth, user: null, isAuthenticated: false });

    expect(await screen.findByRole('heading', { name: 'Inicia sesión' })).toBeInTheDocument();
    expect(bookingService.getUserBookings).not.toHaveBeenCalled();
  });
});
