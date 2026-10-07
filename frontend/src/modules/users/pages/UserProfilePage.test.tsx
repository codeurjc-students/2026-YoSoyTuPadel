import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UserProfilePage from './UserProfilePage';
import { AuthContext, type AuthContextValue } from '../../auth/context/authContext';
import { authService } from '../../auth/services/authService';
import { racketService } from '../../rackets/services/racketService';

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
    fireEvent.click(screen.getByRole('button', { name: 'CONFIRMAR' }));

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
});
