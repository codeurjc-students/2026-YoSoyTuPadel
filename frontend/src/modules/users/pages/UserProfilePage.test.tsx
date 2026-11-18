import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UserProfilePage from './UserProfilePage';
import { AuthContext, type AuthContextValue } from '../../auth/context/authContext';
import { authService } from '../../auth/services/authService';
import { racketService } from '../../rackets/services/racketService';
import type { ReactNode } from 'react';
import api from '../../../service/api';

vi.mock('../../auth/services/authService', () => ({
  authService: {
    getCurrentUser: vi.fn(),
    storeUser: vi.fn(),
    updateUser: vi.fn(),
    uploadUserImage: vi.fn(),
    deleteUser: vi.fn(),
    getErrorMessage: vi.fn(() => 'Profile request failed'),
  },
}));

vi.mock('../../rackets/services/racketService', () => ({
  racketService: {
    getRacketById: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('../../../service/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => (
      <div data-testid="progression-chart-container">{children}</div>
  ),
  AreaChart: ({ data, children }: { data?: unknown[]; children: ReactNode }) => (
      <svg data-testid="progression-chart" data-points={JSON.stringify(data ?? [])}>
        {children}
      </svg>
  ),
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  CartesianGrid: () => null,
}));

const user = {
  id: 4,
  name: 'Alex Smith',
  nickname: 'alex',
  email: 'alex@example.com',
  role: 'USER',
  racketId: null,
};

const authValue: AuthContextValue = {
  user,
  isAuthenticated: true,
  isLoading: false,
  error: null,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn().mockResolvedValue(true),
  clearError: vi.fn(),
  updateUser: vi.fn(),
};

function renderProfile(value: AuthContextValue = authValue) {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={value}>
        <UserProfilePage />
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

describe('UserProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.getCurrentUser).mockResolvedValue(user);
    vi.mocked(api.get).mockResolvedValue({ data: [] });
  });

  it('renders the authenticated user profile data', async () => {
    renderProfile();

    expect(await screen.findByText('MI PERFIL')).toBeInTheDocument();
    expect(screen.getByText('Alex Smith')).toBeInTheDocument();
    expect(screen.getByText('@alex')).toBeInTheDocument();
    expect(screen.getByText('alex@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
  });

  it('disables saving when the edit form has no changes', async () => {
    renderProfile();

    fireEvent.click(await screen.findByRole('button', { name: 'Editar' }));

    expect(screen.getByRole('button', { name: 'GUARDAR' })).toBeDisabled();
  });

  it('updates the profile after editing and confirming changes', async () => {
    vi.mocked(authService.updateUser).mockResolvedValue({
      name: 'Alex Updated',
      nickname: 'alex',
      email: 'alex@example.com',
      sessionPrice: undefined,
    });
    renderProfile();

    fireEvent.click(await screen.findByRole('button', { name: 'Editar' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Name' }), {
      target: { value: 'Alex Updated' },
    });
    expect(screen.getByRole('button', { name: 'GUARDAR' })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: 'GUARDAR' }));
    fireEvent.click(await screen.findByRole('button', { name: 'CONFIRMAR' }));

    await waitFor(() => expect(authService.updateUser).toHaveBeenCalledWith(4, {
      name: 'Alex Updated',
      nickname: 'alex',
      email: 'alex@example.com',
      sessionPrice: undefined,
    }));
    expect(await screen.findByText('Perfil actualizado con éxito')).toBeInTheDocument();
    expect(authValue.updateUser).toHaveBeenCalledWith(expect.objectContaining({ name: 'Alex Updated' }));
  });

  it('loads and displays the active racket when the user has one', async () => {
    const userWithRacket = { ...user, racketId: 8 };
    vi.mocked(authService.getCurrentUser).mockResolvedValue(userWithRacket);
    vi.mocked(racketService.getRacketById).mockResolvedValue({
      id: 8,
      brand: 'Head',
      name: 'Alpha',
      description: 'Control',
      pricePerDay: 10,
      stock: 2,
    });

    renderProfile({ ...authValue, user: userWithRacket });

    expect(await screen.findByText('MATERIAL ACTIVO')).toBeInTheDocument();
    expect(screen.getByText('Head Alpha')).toBeInTheDocument();
    expect(racketService.getRacketById).toHaveBeenCalledWith(8, expect.any(AbortSignal));
  });

  it('prompts to log in if the user is unauthenticated', () => {
    vi.mocked(authService.getCurrentUser).mockReturnValueOnce(new Promise(() => undefined));
    renderProfile({ ...authValue, isAuthenticated: false, user: null });

    expect(screen.getByText('Inicia sesión para ver tu perfil')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ir a iniciar sesión' })).toBeInTheDocument();
  });

  it('renders session price if the user is a coach', async () => {
    const coachUser = { ...user, role: 'COACH', sessionPrice: 25 };
    vi.mocked(authService.getCurrentUser).mockResolvedValue(coachUser);
    renderProfile({ ...authValue, user: coachUser });

    expect(await screen.findByText('Precio por sesión')).toBeInTheDocument();
    expect(screen.getByText('25 €')).toBeInTheDocument();
  });

  it('logs out and redirects to login if the email is changed', async () => {
    vi.mocked(authService.updateUser).mockResolvedValue({
      name: 'Alex', nickname: 'alex', email: 'cambio@example.com', sessionPrice: undefined
    });
    renderProfile();

    const editButton = await screen.findByRole('button', { name: 'Editar' });
    fireEvent.click(editButton);

    const emailInput = await screen.findByRole('textbox', { name: 'Email' });
    fireEvent.change(emailInput, { target: { value: 'cambio@example.com' } });

    fireEvent.click(screen.getByRole('button', { name: 'GUARDAR' }));
    const confirmBtn = await screen.findByRole('button', { name: 'CONFIRMAR' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(authValue.logout).toHaveBeenCalled();
    });
  });

  it('allows permanently deleting the account', async () => {
    renderProfile();

    fireEvent.click(await screen.findByRole('button', { name: /Eliminar Cuenta/i }));
    fireEvent.click(await screen.findByRole('button', { name: 'ELIMINAR' }));

    expect(await screen.findByText('Operación realizada con éxito')).toBeInTheDocument();
    expect(authService.deleteUser).toHaveBeenCalledWith(4);
    expect(authValue.logout).toHaveBeenCalled();
  });

  it('renders level progression chart sorted chronologically with the latest value per day', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: [
        { date: '2026-10-15', currentLevel: 2.85 },
        { date: '2026-10-10', currentLevel: 2.4 },
        { date: '2026-10-10', currentLevel: 2.55 },
      ],
    });

    renderProfile();

    expect(await screen.findByText('PROGRESIÓN DE NIVEL')).toBeInTheDocument();
    const chart = await screen.findByTestId('progression-chart');
    const points = JSON.parse(chart.getAttribute('data-points') ?? '[]') as Array<{
      date: string;
      currentLevel: number;
    }>;

    expect(points).toEqual([
      { date: '2026-10-10', currentLevel: 2.55 },
      { date: '2026-10-15', currentLevel: 2.85 },
    ]);
    expect(api.get).toHaveBeenCalledWith('/api/v1/users/4/progression', {
      signal: expect.any(AbortSignal),
    });
  });

  it('renders a flat baseline progression when the user has no rated trainings yet', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: [
        { date: '2026-10-18', currentLevel: 1.5 },
        { date: '2026-11-18', currentLevel: 1.5 },
      ],
    });

    renderProfile();

    const chart = await screen.findByTestId('progression-chart');
    const points = JSON.parse(chart.getAttribute('data-points') ?? '[]') as Array<{
      date: string;
      currentLevel: number;
    }>;

    expect(points).toEqual([
      { date: '2026-10-18', currentLevel: 1.5 },
      { date: '2026-11-18', currentLevel: 1.5 },
    ]);
  });

  it('shows a defensive info alert if the progression API returns an empty array', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: [] });

    renderProfile();

    expect(
        await screen.findByText(
            'Aún no tienes entrenamientos valorados. Tu progresión aparecerá aquí después de tu primer entrenamiento.',
        ),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('progression-chart')).not.toBeInTheDocument();
  });

  it('shows an error alert when loading level progression fails', async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error('Network error'));

    renderProfile();

    expect(await screen.findByText('Profile request failed')).toBeInTheDocument();
    expect(screen.queryByTestId('progression-chart')).not.toBeInTheDocument();
  });

  it('does not render level progression chart for coaches or admins', async () => {
    const adminUser = { ...user, role: 'ADMIN' };
    vi.mocked(authService.getCurrentUser).mockResolvedValue(adminUser);

    renderProfile({ ...authValue, user: adminUser });

    expect(await screen.findByText('DATOS DEL ADMINISTRADOR')).toBeInTheDocument();
    expect(screen.queryByText('PROGRESIÓN DE NIVEL')).not.toBeInTheDocument();
    expect(api.get).not.toHaveBeenCalled();
  });
});
