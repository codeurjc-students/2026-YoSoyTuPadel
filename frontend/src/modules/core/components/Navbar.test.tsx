import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import Navbar from './Navbar';

const authMocks = vi.hoisted(() => ({
  logout: vi.fn(),
}));

vi.mock('../../auth/hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    logout: authMocks.logout,
  }),
}));

describe('Navbar logout confirmation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.logout.mockResolvedValue(true);
  });

  test('cancelling confirmation does not log out', async () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getAllByRole('button', { name: 'Cerrar sesión' })[0]);
    expect(screen.getByRole('dialog')).toHaveTextContent('¿Estás seguro de que deseas cerrar sesión?');
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(authMocks.logout).not.toHaveBeenCalled();
  });

  test('logs out after explicit confirmation', async () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getAllByRole('button', { name: 'Cerrar sesión' })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Sí, cerrar sesión' }));

    expect(authMocks.logout).toHaveBeenCalledOnce();
  });
});
