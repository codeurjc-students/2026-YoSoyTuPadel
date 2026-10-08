import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import api from '../../service/api';
import { AuthContext, type AuthContextValue } from '../auth/context/authContext';
import CoachDetailPage from './pages/CoachDetailPage';
import CoachListPage from './pages/CoachListPage';

vi.mock('../../service/api', () => ({
  default: { get: vi.fn(), getUri: vi.fn(({ url }: { url: string }) => url), post: vi.fn() },
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
const coach = { id: 3, name: 'María López', skillLevel: 2, sessionPrice: 35 };

function setupApi() {
  vi.mocked(api.get).mockImplementation((url: string) => Promise.resolve({
    data: url.includes('/availability') ? [] : url.endsWith('/coaches')
      ? { content: [coach], number: 0, size: 10, totalElements: 1, totalPages: 1, last: true }
      : coach,
  }));
}

describe('Coaches integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupApi();
  });

  test('list of coaches and opens its detail view', async () => {
    render(
      <MemoryRouter initialEntries={['/coaches']}>
        <AuthContext.Provider value={auth}>
          <Routes>
            <Route path="/coaches" element={<CoachListPage />} />
            <Route path="/coaches/:id" element={<CoachDetailPage />} />
          </Routes>
        </AuthContext.Provider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'María López' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: 'Ver detalles' }));
    expect(await screen.findByText('FEP Nivel 2')).toBeInTheDocument();
  });

  test('check the schedule and book a training session', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { id: 55 } });
    render(
      <MemoryRouter initialEntries={['/coaches/3']}>
        <AuthContext.Provider value={auth}>
          <Routes><Route path="/coaches/:id" element={<CoachDetailPage />} /></Routes>
        </AuthContext.Provider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { level: 1, name: 'María López' })).toBeInTheDocument();
    const date = new Date();
    date.setDate(date.getDate() + 2);
    fireEvent.click(screen.getByRole('button', {
      name: new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: '2-digit', month: 'short' }).format(date),
    }));
    await waitFor(() => expect(screen.getByRole('button', { name: '09:00' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: '09:00' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Reservar sesión · 09:00' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar' }));

    const dialog = await screen.findByRole('dialog', { name: '¡Reserva confirmada!' });
    expect(within(dialog).getByText('Entrenamiento')).toBeInTheDocument();
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/api/v1/bookings', expect.objectContaining({
      userId: 12,
      coachId: 3,
      startTime: '09:00:00',
    })));
  }, 15000);
});
