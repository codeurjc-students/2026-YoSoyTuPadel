import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from '../../auth/context/authContext';
import { racketService } from '../../rackets/services/racketService';
import type { RacketDTO } from '../../rackets/services/racketService';
import { bookingService, type BookingItem } from '../services/bookingService';
import MyBookingsPage from './MyBookingsPage';

vi.mock('../../rackets/services/racketService', () => ({
  racketService: { returnRacket: vi.fn() },
}));
vi.mock('../services/bookingService', () => ({
  bookingService: {
    getUserBookings: vi.fn(),
    cancelBooking: vi.fn(),
    toRacketHistoryItems: vi.fn((rackets: Array<{
      id: number;
      brand: string;
      name: string;
      pricePerDay: number;
    }>) => rackets.map((racket, index) => ({
      id: `racket-history-${index}-${racket.id}`,
      type: 'racket',
      title: `${racket.brand} ${racket.name}`,
      date: null,
      time: null,
      price: racket.pricePerDay,
      image: `/api/v1/rackets/${racket.id}/image`,
      status: 'RETURNED',
    }))),
  },
}));

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const auth: AuthContextValue = {
  user: { id: 9, name: 'Test', nickname: null, email: 'test@example.com', role: 'USER', racketId: null, racketUsages: 0 },
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
    id: 'court-1',
    type: 'court',
    title: 'Pista central',
    date: '2026-10-05',
    time: '10:00',
    price: 15,
    image: '/images/padel-court-overhead.jpg',
    status: 'PENDING',
  },
  {
    id: 'coach-1',
    type: 'coach',
    title: 'María López',
    date: '2026-10-06',
    time: '12:00',
    price: 70,
    image: '/images/coach-training.jpg',
    status: 'COMPLETED',
  },
  {
    id: 'racket-1',
    type: 'racket',
    title: 'Bullpadel Vertex',
    date: null,
    time: null,
    price: 12,
    image: '/images/racket-collection.jpg',
    status: 'ACTIVE',
    remainingUses: 2,
  },
];

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/bookings']}>
      <AuthContext.Provider value={auth}>
        <Routes>
          <Route path="/bookings" element={<MyBookingsPage />} />
          <Route path="/courts" element={<h1>Catálogo de pistas</h1>} />
          <Route path="/coaches" element={<h1>Catálogo de entrenadores</h1>} />
          <Route path="/rackets" element={<h1>Catálogo de palas</h1>} />
          <Route path="/login" element={<h1>Inicia sesión</h1>} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

describe('MyBookingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(bookingService.getUserBookings).mockResolvedValue(bookings);
  });

  test('shows booking history and filters by category', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Pista central' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'María López' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Bullpadel Vertex' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Entrenamientos' }));
    expect(screen.getByRole('heading', { name: 'María López' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Pista central' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Bullpadel Vertex' })).not.toBeInTheDocument();

    expect(bookingService.getUserBookings).toHaveBeenCalledWith(9, expect.any(AbortSignal));
  });

  test('separates pending and finished bookings and omits the pending status badge', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Pista central' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Reservas pendientes' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Reservas terminadas' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Todas mis reservas' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Todas' })).toBeInTheDocument();
    expect(screen.queryByText('Pendiente')).not.toBeInTheDocument();
    expect(screen.getByText('Alquiler actual · 2 usos restantes')).toBeInTheDocument();
  });

  test('orders pending bookings earliest first and finished bookings most recent first', async () => {
    const today = new Date();

    const pastEarlier = new Date(today);
    pastEarlier.setDate(today.getDate() - 10);

    const pastLater = new Date(today);
    pastLater.setDate(today.getDate() - 5);

    const futureEarlier = new Date(today);
    futureEarlier.setDate(today.getDate() + 5);

    const futureLater = new Date(today);
    futureLater.setDate(today.getDate() + 10);

    vi.mocked(bookingService.getUserBookings).mockResolvedValue([
      { ...bookings[0], id: 'pending-later', title: 'Pendiente posterior', date: formatLocalDate(futureLater), time: '11:00' },
      { ...bookings[1], id: 'finished-earlier', title: 'Terminada anterior', date: formatLocalDate(pastEarlier) },
      { ...bookings[0], id: 'pending-earlier', title: 'Pendiente próxima', date: formatLocalDate(futureEarlier), time: '09:00' },
      { ...bookings[1], id: 'finished-later', title: 'Terminada reciente', date: formatLocalDate(pastLater) },
    ]);
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Pendiente próxima' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)).toEqual([
      'Pendiente próxima',
      'Pendiente posterior',
      'Terminada reciente',
      'Terminada anterior',
    ]);
  });

  test('loads more pending and finished bookings independently', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    const bookingDate = formatLocalDate(futureDate);
    vi.mocked(bookingService.getUserBookings).mockResolvedValue([
      ...Array.from({ length: 11 }, (_, index) => ({
        ...bookings[0],
        id: `pending-${index + 1}`,
        title: `Pendiente ${index + 1}`,
        date: bookingDate,
      })),
      ...Array.from({ length: 11 }, (_, index) => ({
        ...bookings[1],
        id: `finished-${index + 1}`,
        title: `Terminada ${index + 1}`,
        status: 'COMPLETED',
        date: bookingDate,
      })),
    ]);
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Pendiente 1' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Pendiente 10' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Pendiente 11' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Terminada 1' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Terminada 10' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Terminada 11' })).not.toBeInTheDocument();

    const loadMoreButtons = screen.getAllByRole('button', { name: 'Más resultados' });
    expect(loadMoreButtons).toHaveLength(2);
    fireEvent.click(loadMoreButtons[0]);

    expect(await screen.findByRole('heading', { name: 'Pendiente 11' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Terminada 1' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Terminada 11' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Más resultados' })).toHaveLength(1);
  });

  test('shows category-specific empty state and link', async () => {
    vi.mocked(bookingService.getUserBookings).mockResolvedValue([]);
    renderPage();

    expect(await screen.findByText('No tienes reservas en esta categoría')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Material' }));
    expect(screen.getByRole('link', { name: 'Explorar palas' })).toHaveAttribute('href', '/rackets');
  });

  test('confirms cancellation, updates the booking locally and shows success', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    vi.mocked(bookingService.getUserBookings).mockResolvedValue([
      { ...bookings[0], id: 'booking-1', date: formatLocalDate(tomorrow) },
    ]);
    vi.mocked(bookingService.cancelBooking).mockResolvedValue();
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Cancelar reserva' }));
    expect(screen.getByText('¿Estás seguro de que quieres cancelar esta reserva de Pista central?')).toBeInTheDocument();
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar cancelación' }));

    expect(await screen.findByText('Reserva cancelada con éxito')).toBeInTheDocument();
    expect(bookingService.cancelBooking).toHaveBeenCalledWith('booking-1', 'court');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('heading', { name: 'Pista central' })).toBeInTheDocument();
    expect(screen.getByText('Cancelada')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancelar reserva' })).not.toBeInTheDocument();
  });

  test('returns an active racket and replaces it with history on the material tab', async () => {
    const returnedRacket: RacketDTO = {
      id: 8,
      brand: 'Bullpadel',
      name: 'Vertex',
      description: 'Pala de prueba',
      pricePerDay: 12,
      stock: 4,
    };
    vi.mocked(racketService.returnRacket).mockResolvedValue({
      id: 9,
      racketId: null,
      racketHistory: [returnedRacket],
    });
    renderPage();

    fireEvent.click(screen.getByRole('tab', { name: 'Material' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Devolver raqueta' }));
    expect(screen.getByText('¿Estás seguro de que quieres devolver la raqueta Bullpadel Vertex?')).toBeInTheDocument();
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar devolución' }));

    expect(await screen.findByText('Raqueta devuelta con éxito')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(racketService.returnRacket).toHaveBeenCalledWith(9);
    expect(screen.getByRole('heading', { name: 'Bullpadel Vertex' })).toBeInTheDocument();
    expect(screen.getByText('Devuelta')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Devolver raqueta' })).not.toBeInTheDocument();
  });

  test('shows returned rackets under finished bookings without an action button', async () => {
    vi.mocked(bookingService.getUserBookings).mockResolvedValue([
      {
        ...bookings[2],
        id: 'racket-history-0-8',
        status: 'RETURNED',
      },
    ]);
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Todas mis reservas' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Bullpadel Vertex' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Material' }));
    expect(await screen.findByRole('heading', { name: 'Bullpadel Vertex' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Palas usadas anteriormente' })).toBeInTheDocument();
    expect(screen.getByText('Devuelta')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Devolver raqueta' })).not.toBeInTheDocument();
  });

  test('deduplicates returned racket history by title in material', async () => {
    vi.mocked(bookingService.getUserBookings).mockResolvedValue([
      { ...bookings[2], id: 'racket-history-0-8', status: 'RETURNED' },
      { ...bookings[2], id: 'racket-history-1-8', status: 'RETURNED' },
    ]);
    renderPage();

    fireEvent.click(screen.getByRole('tab', { name: 'Material' }));
    expect(await screen.findByRole('heading', { name: 'Palas usadas anteriormente' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: 'Bullpadel Vertex' })).toHaveLength(1);
  });

  test('hides cancellation and marks an elapsed reservation completed', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    vi.mocked(bookingService.getUserBookings).mockResolvedValue([
      { ...bookings[0], date: formatLocalDate(yesterday) },
    ]);
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Pista central' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancelar reserva' })).not.toBeInTheDocument();
    expect(screen.getByText('Completada')).toBeInTheDocument();
  });
});
