import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { AuthProvider } from '../context/AuthProvider.tsx';
import AuthPage from './AuthPage';

const authServiceMocks = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  refresh: vi.fn(),
  getCurrentUser: vi.fn(),
  readStoredUser: vi.fn(() => null),
  storeUser: vi.fn(),
  getErrorMessage: vi.fn(() => 'No se pudo iniciar sesión.'),
}));

vi.mock('../services/authService', () => ({
  authService: authServiceMocks,
}));

function renderAuthPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <AuthPage />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('AuthPage', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test('switches between login and registration forms', () => {
    renderAuthPage();

    expect(screen.getByLabelText(/^Email/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/^Nombre completo/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Registrarse' }));

    expect(screen.getByLabelText(/^Nombre completo/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Nombre de usuario/)).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  test('submits login credentials through the auth context', async () => {
    authServiceMocks.login.mockResolvedValue({
      id: 7,
      name: 'Ana',
      nickname: 'ana',
      email: 'ana@example.com',
      role: 'USER',
    });
    renderAuthPage();

    fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: 'ana@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Contraseña/), { target: { value: 'secure-password' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Iniciar sesión' })[1]);

    await waitFor(() => {
      expect(authServiceMocks.login).toHaveBeenCalledWith({
        email: 'ana@example.com',
        password: 'secure-password',
      });
    });
  });
});
