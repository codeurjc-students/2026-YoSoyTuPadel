import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from '../../auth/context/authContext';
import { racketService } from '../services/racketService';
import RacketDetailPage from './RacketDetailPage';

vi.mock('../services/racketService', () => ({
  racketService: {
    getRacketById: vi.fn(),
    rentRacket: vi.fn(),
  },
}));

const racketDto = {
  id: 3,
  brand: 'Bullpadel',
  name: 'Vertex 04',
  description: 'Pala para prueba',
  pricePerDay: 8,
  stock: 3,
};

const authenticatedUser: AuthContextValue = {
  user: { id: 1, name: 'Test', nickname: null, email: 'test@example.com', role: 'USER' },
  isAuthenticated: true,
  isLoading: false,
  error: null,
  login: async () => true,
  register: async () => true,
  logout: async () => true,
  clearError: () => {},
};

const guestUser: AuthContextValue = {
  ...authenticatedUser,
  user: null,
  isAuthenticated: false,
};

describe('RacketDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(racketService.getRacketById).mockResolvedValue(racketDto);
  });

  test('loads backend racket details and completes booking confirmation', async () => {
    render(
      <MemoryRouter initialEntries={['/rackets/3']}>
        <Routes>
          <Route
            path="/rackets/:id"
            element={
              <AuthContext.Provider value={authenticatedUser}>
                <RacketDetailPage />
              </AuthContext.Provider>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'Bullpadel Vertex 04' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Bullpadel Vertex 04' })).toHaveAttribute('src', '/api/v1/rackets/3/image');

    fireEvent.click(screen.getByRole('button', { name: 'Reservar' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('¿Seguro que quieres alquilar la pala Bullpadel Vertex 04?');

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    expect(screen.getByRole('progressbar', { name: 'Confirmando reserva' })).toBeInTheDocument();
    expect(racketService.rentRacket).toHaveBeenCalledWith(1, 3);
    expect(await screen.findByText('¡Pala reservada con éxito!', {}, { timeout: 2000 })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  test('redirects unauthenticated visitors to login', async () => {
    render(
      <MemoryRouter initialEntries={['/rackets/3']}>
        <Routes>
          <Route path="/rackets/:id" element={<AuthContext.Provider value={guestUser}><RacketDetailPage /></AuthContext.Provider>} />
          <Route path="/login" element={<h1>Inicio de sesión</h1>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'Inicio de sesión' })).toBeInTheDocument();
  });

  test('redirects users who already have a racket to their bookings material tab', async () => {
    const userWithRacket: AuthContextValue = {
      ...authenticatedUser,
      user: { id: 1, name: 'Test', nickname: null, email: 'test@example.com', role: 'USER', racketId: 8 },
    };
    render(
      <MemoryRouter initialEntries={['/rackets/3']}>
        <Routes>
          <Route path="/rackets/:id" element={<AuthContext.Provider value={userWithRacket}><RacketDetailPage /></AuthContext.Provider>} />
          <Route path="/bookings" element={<h1>Material de mis reservas</h1>} />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByRole('heading', { name: 'Bullpadel Vertex 04' });
    fireEvent.click(screen.getByRole('button', { name: 'Reservar' }));

    expect(await screen.findByRole('heading', { name: 'Material de mis reservas' })).toBeInTheDocument();
    expect(racketService.rentRacket).not.toHaveBeenCalled();
  });

  test('redirects to bookings material if the backend reports an existing rental', async () => {
    vi.mocked(racketService.rentRacket).mockRejectedValue({
      response: { data: { message: 'You already have a rented racket.' } },
      isAxiosError: true,
    });
    render(
      <MemoryRouter initialEntries={['/rackets/3']}>
        <Routes>
          <Route path="/rackets/:id" element={<AuthContext.Provider value={authenticatedUser}><RacketDetailPage /></AuthContext.Provider>} />
          <Route path="/bookings" element={<h1>Material de mis reservas</h1>} />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByRole('heading', { name: 'Bullpadel Vertex 04' });
    fireEvent.click(screen.getByRole('button', { name: 'Reservar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(await screen.findByRole('heading', { name: 'Material de mis reservas' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('shows an error snackbar when the real reservation request fails', async () => {
    vi.mocked(racketService.rentRacket).mockRejectedValue(new Error('Reservation failed'));
    render(
      <MemoryRouter initialEntries={['/rackets/3']}>
        <Routes>
          <Route path="/rackets/:id" element={<AuthContext.Provider value={authenticatedUser}><RacketDetailPage /></AuthContext.Provider>} />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByRole('heading', { name: 'Bullpadel Vertex 04' });
    fireEvent.click(screen.getByRole('button', { name: 'Reservar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(await screen.findByText('No se ha podido reservar la pala. Inténtalo de nuevo.')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  test('hides reservation and links back to racket list when stock is empty', async () => {
    vi.mocked(racketService.getRacketById).mockResolvedValue({ ...racketDto, stock: 0 });
    render(
      <MemoryRouter initialEntries={['/rackets/3']}>
        <Routes>
          <Route path="/rackets/:id" element={<AuthContext.Provider value={authenticatedUser}><RacketDetailPage /></AuthContext.Provider>} />
          <Route path="/rackets" element={<h1>Catálogo de Palas</h1>} />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByRole('heading', { name: 'Bullpadel Vertex 04' });
    expect(screen.getByText('En estos momentos no tenemos más raquetas de este modelo.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reservar' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: 'Mirar otras palas' }));
    expect(await screen.findByRole('heading', { name: 'Catálogo de Palas' })).toBeInTheDocument();
  });
});
