import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import api from '../../service/api';
import { AuthContext, type AuthContextValue } from '../auth/context/authContext';
import CourtDetailPage from './pages/CourtDetailPage';
import CourtListPage from './pages/CourtListPage';

vi.mock('../../service/api', () => ({
  default: { get: vi.fn(), post: vi.fn() },
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

const court = { id: 4, name: 'Pista central', courtPrice: 8, type: 'INDOOR', surface: 'GLASS', isAvailable: true };

function renderListAndDetail() {
  return render(
    <MemoryRouter initialEntries={['/courts']}>
      <AuthContext.Provider value={auth}>
        <Routes>
          <Route path="/courts" element={<CourtListPage />} />
          <Route path="/courts/:id" element={<CourtDetailPage />} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

function tomorrowLabel() {
  const date = new Date();
  date.setDate(date.getDate() + 2);
  return new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: '2-digit', month: 'short' }).format(date);
}

describe('Integración de pistas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.get).mockImplementation((url: string) => Promise.resolve({
      data: url.includes('/availability') ? ['11:00'] : url.endsWith('/courts/4') ? court : {
        content: [court],
        number: 0,
        size: 10,
        totalElements: 1,
        totalPages: 1,
        last: true,
      },
    }));
  });

  test('carga el catálogo y navega al detalle de una pista', async () => {
    renderListAndDetail();

    fireEvent.click(await screen.findByRole('link', { name: 'Ver disponibilidad' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Pista central' })).toBeInTheDocument();
  });

  test('consulta disponibilidad y bloquea una franja ya ocupada', async () => {
    renderListAndDetail();
    fireEvent.click(await screen.findByRole('link', { name: 'Ver disponibilidad' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Pista central' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: tomorrowLabel() }));
    expect(await screen.findByRole('button', { name: '11:00, reservada' })).toBeDisabled();
  });

  test('envía una reserva y muestra el resumen de confirmación', async () => {
    vi.mocked(api.get).mockImplementation((url: string) => Promise.resolve({
      data: url.includes('/availability') ? [] : court,
    }));
    vi.mocked(api.post).mockResolvedValue({ data: { id: 44 } });
    render(
      <MemoryRouter initialEntries={['/courts/4']}>
        <AuthContext.Provider value={auth}>
          <Routes><Route path="/courts/:id" element={<CourtDetailPage />} /></Routes>
        </AuthContext.Provider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { level: 1, name: 'Pista central' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: tomorrowLabel() }));
    const timeSlotButton = await screen.findByRole('button', { name: '09:00' });
    fireEvent.click(timeSlotButton);
    fireEvent.click(await screen.findByRole('button', { name: /Finalizar/i }));

    fireEvent.click(await screen.findByRole('button', { name: /Confirmar/i }));

    const dialog = await screen.findByRole('dialog', { name: '¡Reserva confirmada!' });
    expect(within(dialog).getByText('Pista central')).toBeInTheDocument();
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/api/v1/bookings', expect.objectContaining({
      userId: 12,
      courtId: 4,
      startTime: '09:00:00',
    })));
  }, 15000);
});
