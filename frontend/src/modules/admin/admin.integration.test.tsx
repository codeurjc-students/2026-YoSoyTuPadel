import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import api from '../../service/api';
import { AuthContext, type AuthContextValue } from '../auth/context/authContext';
import { authService } from '../auth/services/authService';
import AdminDashboardPage from './pages/AdminDashboardPage';
import UserProfilePage from '../users/pages/UserProfilePage';
import toast from 'react-hot-toast';

vi.mock('../../service/api', () => ({
  default: { get: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));
vi.mock('../auth/services/authService', () => ({
  authService: {
    getCurrentUser: vi.fn(),
    updateUser: vi.fn(),
    storeUser: vi.fn(),
    getErrorMessage: vi.fn(() => 'Los datos no son válidos'),
  },
}));
vi.mock('../courts/services/courtService', () => ({
  courtService: { getCourtById: vi.fn() },
}));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

const user = { id: 7, name: 'Ana López', nickname: 'ana', email: 'ana@example.com', role: 'USER' };
const admin = { ...user, role: 'ADMIN' };
const auth = (currentUser = user): AuthContextValue => ({
  user: currentUser,
  isAuthenticated: true,
  isLoading: false,
  error: null,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  clearError: vi.fn(),
  updateUser: vi.fn(),
});

describe('Integración de perfil y administración', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.getCurrentUser).mockResolvedValue(user);
  });

  test('actualiza el perfil autenticado y refleja el resultado', async () => {
    vi.mocked(authService.updateUser).mockResolvedValue({ ...user });
    const value = auth();
    render(
      <MemoryRouter>
        <AuthContext.Provider value={value}><UserProfilePage /></AuthContext.Provider>
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Editar' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Name' }), { target: { value: 'Ana Actualizada' } });
    fireEvent.click(screen.getByRole('button', { name: 'GUARDAR' }));
    fireEvent.click(screen.getByRole('button', { name: 'CONFIRMAR' }));

    await waitFor(() => expect(authService.updateUser).toHaveBeenCalledWith(7, expect.objectContaining({
      name: 'Ana Actualizada',
    })));
    expect(await screen.findByText('Perfil actualizado con éxito')).toBeInTheDocument();
  });

  test('muestra un error cuando falla la actualización con datos inválidos', async () => {
    vi.mocked(authService.updateUser).mockRejectedValue(new Error('invalid'));
    render(
      <MemoryRouter>
        <AuthContext.Provider value={auth()}><UserProfilePage /></AuthContext.Provider>
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Editar' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Name' }), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'GUARDAR' }));
    fireEvent.click(screen.getByRole('button', { name: 'CONFIRMAR' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Los datos no son válidos'));
  });

  test('administra usuarios y reservas desde sus pestañas', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: [user] })
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [user] });
    render(
      <MemoryRouter>
        <AuthContext.Provider value={auth(admin)}><AdminDashboardPage /></AuthContext.Provider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'PANEL DE ADMINISTRACIÓN' })).toBeInTheDocument();
    expect(screen.getByText('Ana López')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Reservas' }));
    expect(await screen.findByRole('tab', { name: 'Reservas' })).toHaveAttribute('aria-selected', 'true');
    expect(api.get).toHaveBeenCalled();
  });
});
