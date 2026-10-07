import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from '../../auth/context/authContext';
import { racketService } from '../services/racketService';
import RacketDetailPage from './RacketDetailPage';

vi.mock('../services/racketService', () => ({
  racketService: {
    getRacketById: vi.fn(),
    rentRacket: vi.fn(),
    updateRacket: vi.fn(),
    uploadRacketImage: vi.fn(),
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

const adminUser: AuthContextValue = {
  ...authenticatedUser,
  user: { ...authenticatedUser.user!, role: 'ADMIN' },
};

function renderDetail(authValue: AuthContextValue = authenticatedUser) {
  return render(
    <MemoryRouter initialEntries={['/rackets/3']}>
      <Routes>
        <Route
          path="/rackets/:id"
          element={
            <AuthContext.Provider value={authValue}>
              <RacketDetailPage />
            </AuthContext.Provider>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('RacketDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(racketService.getRacketById).mockResolvedValue(racketDto);
  });

  it('renders racket title, price and completes a rental confirmation', async () => {
    renderDetail();

    expect(await screen.findByRole('heading', { name: 'Bullpadel Vertex 04' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Bullpadel Vertex 04' })).toHaveAttribute('src', '/api/v1/rackets/3/image');
    expect(screen.getByText('8,00 €')).toBeInTheDocument();
    expect(screen.getByText('Stock disponible: 3')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Reservar' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('¿Seguro que quieres alquilar la pala Bullpadel Vertex 04?');

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    expect(screen.getByRole('progressbar', { name: 'Confirmando reserva' })).toBeInTheDocument();
    expect(racketService.rentRacket).toHaveBeenCalledWith(1, 3);
    expect(await screen.findByText('¡Pala reservada con éxito!', {}, { timeout: 2000 })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('redirects unauthenticated visitors to login', async () => {
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

  it('redirects users who already have a racket to their bookings material tab', async () => {
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

  it('redirects to bookings material if the backend reports an existing rental', async () => {
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

  it('shows an error snackbar when the reservation request fails', async () => {
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

  it('hides reservation and links back to racket list when stock is empty', async () => {
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

  it('hides administrative controls for regular users', async () => {
    renderDetail();

    await screen.findByRole('heading', { name: 'Bullpadel Vertex 04' });

    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Eliminar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Actualizar foto' })).not.toBeInTheDocument();
  });

  it('allows administrators to edit racket data and update its photo', async () => {
    vi.mocked(racketService.updateRacket).mockResolvedValue({
      ...racketDto,
      name: 'Vertex Pro',
    });
    vi.mocked(racketService.uploadRacketImage).mockResolvedValue();
    renderDetail(adminUser);

    await screen.findByRole('heading', { name: 'Bullpadel Vertex 04' });
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Eliminar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Actualizar foto' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reservar' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Nombre' }), {
      target: { value: 'Vertex Pro' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => expect(racketService.updateRacket).toHaveBeenCalledWith(expect.objectContaining({
      id: racketDto.id,
      brand: racketDto.brand,
      description: racketDto.description,
      pricePerDay: racketDto.pricePerDay,
      stock: racketDto.stock,
      name: 'Vertex Pro',
    })));
    expect(await screen.findByRole('heading', { name: 'Bullpadel Vertex Pro' })).toBeInTheDocument();

    const imageFile = new File(['image'], 'racket.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Actualizar foto'), {
      target: { files: [imageFile] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    await waitFor(() => expect(racketService.uploadRacketImage).toHaveBeenCalledWith(3, imageFile));
  });
});
