import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { Mock } from 'vitest';
import App from '../../App';
import api from '../../service/api';
import { AuthContext, type AuthContextValue } from '../auth/context/authContext';
import Navbar from './components/Navbar';

vi.mock('../../service/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('Core layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.get as Mock).mockImplementation((url: string) => {
      if (url === '/api/v1/courts') {
        return Promise.resolve({ data: { content: [], totalElements: 20 } });
      }
      if (url === '/api/v1/users/coaches') {
        return Promise.resolve({
          data: {
            content: Array.from({ length: 9 }, (_, id) => ({ id })),
            number: 0,
            size: 10,
            totalElements: 9,
            totalPages: 1,
            last: true,
          },
        });
      }
      if (url === '/api/v1/rackets') {
        return Promise.resolve({
          data: {
            content: [{ id: 1, brand: 'Test', name: 'Racket', stock: 90 }],
            number: 0,
            size: 10,
            totalElements: 1,
            totalPages: 1,
            last: true,
          },
        });
      }
      return Promise.resolve({ data: [] });
    });
  });

  test('renders the home page inside the shared layout', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '¿Qué necesitas hoy?' })).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Mis reservas' })).not.toBeInTheDocument();
  });

  test.each(['USER', 'COACH'])('shows role navigation to authenticated %s accounts', (role) => {
    const authValue: AuthContextValue = {
      user: { id: 1, name: 'Test', nickname: null, email: 'test@example.com', role },
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
    };

    render(
      <MemoryRouter>
        <AuthContext.Provider value={authValue}>
          <Navbar />
        </AuthContext.Provider>
      </MemoryRouter>,
    );

    if (role === 'USER') {
      expect(screen.getByRole('link', { name: 'Mis reservas' })).toBeInTheDocument();
    } else {
      expect(screen.getByRole('link', { name: 'Panel de entrenador' })).toBeInTheDocument();
    }
  });

  test('renders the authentication page at /login', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Inicia sesión' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toBeInTheDocument();
  });

  test('shows the current Spanish date and counts from the API', async () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByLabelText('20 pistas')).toBeInTheDocument();
    expect(screen.getByLabelText('9 entrenadores')).toBeInTheDocument();
    expect(screen.getByLabelText('90 palas disponibles')).toBeInTheDocument();
    expect(document.querySelector('img[src="/images/padel-court-overhead.jpg"]')).toBeInTheDocument();
    expect(document.querySelector('img[src="/images/coach-training.jpg"]')).toBeInTheDocument();
    expect(document.querySelector('img[src="/images/racket-collection.jpg"]')).toBeInTheDocument();
    expect(screen.getAllByRole('time')[0].textContent).toMatch(/^\d{1,2} de [a-záéíóú]+$/);
  });

  test('provides direct links from home to login and registration', async () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute('href', '/login');
    fireEvent.click(screen.getByRole('link', { name: 'Crear cuenta' }));

    expect(await screen.findByRole('heading', { name: 'Crea tu cuenta' })).toBeInTheDocument();
  });

  test('opens the mobile menu and navigates to the rackets page', async () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Abrir menú' }));
    expect(screen.getByRole('navigation', { name: 'Navegación móvil' })).toBeInTheDocument();

    const mobileNavigation = screen.getByRole('navigation', { name: 'Navegación móvil' });
    fireEvent.click(within(mobileNavigation).getByRole('link', { name: 'Palas' }));

    expect(await screen.findByRole('heading', { name: 'Catálogo de Palas' })).toBeInTheDocument();
  });
});
