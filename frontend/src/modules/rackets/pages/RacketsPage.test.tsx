import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from '../../auth/context/authContext';
import { racketService, type RacketPage } from '../services/racketService';
import RacketsPage from './RacketsPage';

vi.mock('../services/racketService', () => ({
  racketService: {
    getRackets: vi.fn(),
    createRacket: vi.fn(),
    uploadRacketImage: vi.fn(),
  },
}));

const catalogue: RacketPage = {
  content: [
    { id: 1, brand: 'Bullpadel', name: 'Vertex 04', stock: 2 },
    { id: 2, brand: 'Head', name: 'Alpha Motion', stock: 0 },
  ],
  number: 0,
  size: 10,
  totalElements: 2,
  totalPages: 1,
  last: true,
};

const userAuth: AuthContextValue = {
  user: {
    id: 1,
    name: 'Test user',
    nickname: 'test-user',
    email: 'test@example.com',
    role: 'USER',
  },
  isAuthenticated: true,
  isLoading: false,
  error: null,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  clearError: vi.fn(),
};

function renderCatalogue(authValue: AuthContextValue = userAuth) {
  return render(
      <MemoryRouter>
        <AuthContext.Provider value={authValue}>
          <RacketsPage />
        </AuthContext.Provider>
      </MemoryRouter>,
  );
}

describe('RacketsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders racket cards with their titles and availability states', async () => {
    vi.mocked(racketService.getRackets).mockResolvedValue(catalogue);

    renderCatalogue();

    expect(await screen.findByRole('heading', { name: 'Bullpadel - Vertex 04' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Head - Alpha Motion' })).toBeInTheDocument();
    expect(screen.getByText('2 palas disponibles')).toBeInTheDocument();
    expect(screen.getByText('Agotada')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver detalles de Bullpadel Vertex 04' }))
        .toHaveAttribute('href', '/rackets/1');
  });

  it('renders the loading indicator while the catalogue request is pending', () => {
    vi.mocked(racketService.getRackets).mockReturnValue(new Promise(() => undefined));

    renderCatalogue();

    expect(screen.getByRole('status', { name: 'Cargando palas' })).toBeInTheDocument();
  });

  it('renders empty state when there are no rackets', async () => {
    vi.mocked(racketService.getRackets).mockResolvedValue({
      ...catalogue,
      content: [],
      totalElements: 0,
    });

    renderCatalogue();

    expect(await screen.findByText('Todavía no hay palas disponibles.')).toBeInTheDocument();
  });

  it('renders login button for unauthenticated users', async () => {
    vi.mocked(racketService.getRackets).mockResolvedValue(catalogue);
    renderCatalogue({ ...userAuth, isAuthenticated: false, user: null });

    const loginLinks = await screen.findAllByRole('link', { name: 'Inicia sesión para reservar' });
    expect(loginLinks.length).toBeGreaterThan(0);
  });

  it('renders error state with retry button if initial load fails', async () => {
    vi.mocked(racketService.getRackets).mockRejectedValue(new Error('API Error'));
    renderCatalogue();

    expect(await screen.findByText('No se ha podido conectar con el servidor.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });

  it('allows an administrator to create a new racket', async () => {
    vi.mocked(racketService.getRackets).mockResolvedValue(catalogue);
    vi.mocked(racketService.createRacket).mockResolvedValue({
      id: 3,
      brand: 'Nox',
      name: 'AT10',
      description: 'Test',
      pricePerDay: 5,
      stock: 10,
    });

    renderCatalogue({ ...userAuth, user: { ...userAuth.user!, role: 'ADMIN' } });

    const newButton = await screen.findByRole('button', { name: /Nueva pala/i });
    fireEvent.click(newButton);
    const brandInput = await screen.findByLabelText(/Marca/i);
    const nameInput = screen.getByLabelText(/Nombre/i);
    const descInput = screen.getByLabelText(/Descripción/i);
    const stockInput = screen.getByLabelText(/Stock/i);
    const priceInput = screen.getByLabelText(/Precio/i);

    fireEvent.change(brandInput, { target: { value: 'Nox' } });
    fireEvent.change(nameInput, { target: { value: 'AT10' } });
    fireEvent.change(descInput, { target: { value: 'Pala de control' } });
    fireEvent.change(stockInput, { target: { value: '10' } });
    fireEvent.change(priceInput, { target: { value: '5' } });

    const continueButton = screen.getByRole('button', { name: /Continuar/i });
    expect(continueButton).not.toBeDisabled();
    fireEvent.click(continueButton);
    const confirmButton = await screen.findByRole('button', { name: /Confirmar/i });
    fireEvent.click(confirmButton);

    expect(racketService.createRacket).toHaveBeenCalledWith({
      brand: 'Nox',
      name: 'AT10',
      description: 'Pala de control',
      stock: 10,
      pricePerDay: 5,
    });
  });

  it('loads more rackets when clicking the pagination button', async () => {
    vi.mocked(racketService.getRackets).mockResolvedValue({
      ...catalogue,
      last: false,
      content: Array(10).fill(catalogue.content[0]),
    });
    renderCatalogue();

    const loadMoreButton = await screen.findByRole('button', { name: /Más resultados/i });
    fireEvent.click(loadMoreButton);

    expect(racketService.getRackets).toHaveBeenCalledWith(1, 10);
  });
});