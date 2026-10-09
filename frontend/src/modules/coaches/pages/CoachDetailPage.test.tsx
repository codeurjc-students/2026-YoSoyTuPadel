import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import api from '../../../service/api';
import { AuthContext, type AuthContextValue } from '../../auth/context/authContext';
import CoachDetailPage from './CoachDetailPage';

vi.mock('../../../service/api', () => ({
  default: {
    get: vi.fn(),
    getUri: vi.fn(({ url }: { url: string }) => url),
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

function renderCoachDetail() {
  return render(
    <MemoryRouter initialEntries={['/coaches/3']}>
      <AuthContext.Provider value={signedInAuth}>
        <Routes>
          <Route path="/coaches/:id" element={<CoachDetailPage />} />
          <Route path="/coaches" element={<h1>Catálogo de Entrenadores</h1>} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

async function selectTomorrow() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const label = new Intl.DateTimeFormat('es-ES', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).format(tomorrow);

  const dayButton = await screen.findByRole('button', { name: label });
  fireEvent.click(dayButton);
}

describe('CoachDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.get).mockImplementation((url: string) => Promise.resolve({
      data: url.includes('/availability')
        ? []
        : { id: 3, name: 'María López', skillLevel: 2, sessionPrice: 35 },
    }));
  });

  afterEach(() => vi.useRealTimers());

  test('shows the FEP level and its specialty', async () => {
    renderCoachDetail();

    expect(await screen.findByText('FEP Nivel 2')).toBeInTheDocument();
    expect(screen.getByText('Para juveniles y junior')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Entrenamiento de pádel con María López' })).toHaveAttribute(
      'src',
      '/api/v1/users/coaches/3/image',
    );
  });

  test('disables time slots at or before the current hour when booking today', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 3, 12, 30));
    renderCoachDetail();

    expect(await screen.findByRole('heading', { level: 1, name: 'María López' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '09:00, no disponible' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '11:00, no disponible' })).toBeDisabled();
    await waitFor(() => expect(screen.getByRole('button', { name: '13:00' })).toBeEnabled());
  });

  test('shows the court-style success dialog after booking a training session', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { id: 12 } });
    renderCoachDetail();

    expect(await screen.findByRole('heading', { level: 1, name: 'María López' })).toBeInTheDocument();

    await selectTomorrow();

    const timeSlot = await screen.findByRole('button', { name: '09:00' });
    fireEvent.click(timeSlot);

    const reserveBtn = await screen.findByRole('button', { name: 'Reservar sesión · 09:00' });
    fireEvent.click(reserveBtn);

    const confirmBtn = await screen.findByRole('button', { name: 'Confirmar' });
    fireEvent.click(confirmBtn);

    const successDialog = await screen.findByRole('dialog', { name: '¡Reserva confirmada!' });
    expect(within(successDialog).getByText('María López')).toBeInTheDocument();
    expect(within(successDialog).getByText('2 horas')).toBeInTheDocument();
    expect(within(successDialog).getByText('Entrenamiento')).toBeInTheDocument();

    const returnBtn = await within(successDialog).findByRole('button', { name: 'Volver a entrenadores' });
    fireEvent.click(returnBtn);

    expect(await screen.findByRole('heading', { name: 'Catálogo de Entrenadores' })).toBeInTheDocument();
  });

  test('disables slots already reserved with the coach', async () => {
    vi.mocked(api.get).mockImplementation((url: string) => Promise.resolve({
      data: url.includes('/availability')
          ? ['09:00', '13:00']
          : { id: 3, name: 'María López', skillLevel: 2, sessionPrice: 35 },
    }));
    renderCoachDetail();

    expect(await screen.findByRole('heading', { level: 1, name: 'María López' })).toBeInTheDocument();

    await selectTomorrow();

    expect(await screen.findByRole('button', { name: '09:00, reservada' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '13:00, reservada' })).toBeDisabled();

    const availableBtn = await screen.findByRole('button', { name: '11:00' });
    expect(availableBtn).toBeEnabled();

    expect(screen.getByRole('button', { name: 'Reservar sesión' })).toBeDisabled();
  });
});
