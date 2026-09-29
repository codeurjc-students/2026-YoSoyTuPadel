import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { Mock } from 'vitest';
import App from '../../App';
import api from '../../service/api';

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
        return Promise.resolve({ data: Array.from({ length: 12 }, (_, id) => ({ id })) });
      }
      if (url === '/api/v1/users/coachs') {
        return Promise.resolve({ data: Array.from({ length: 8 }, (_, id) => ({ id })) });
      }
      if (url === '/api/v1/rackets') {
        return Promise.resolve({ data: [{ stock: 3 }, { stock: 0 }] });
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
  });

  test('shows the current Spanish date and counts from the API', async () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByLabelText('12 pistas')).toBeInTheDocument();
    expect(screen.getByLabelText('8 entrenadores')).toBeInTheDocument();
    expect(screen.getByLabelText('3 palas disponibles')).toBeInTheDocument();
    expect(document.querySelector('img[src="/images/padel-court-overhead.jpg"]')).toBeInTheDocument();
    expect(document.querySelector('img[src="/images/coach-training.jpg"]')).toBeInTheDocument();
    expect(document.querySelector('img[src="/images/racket-collection.jpg"]')).toBeInTheDocument();
    expect(screen.getAllByRole('time')[0].textContent).toMatch(/^\d{1,2} de [a-záéíóú]+$/);
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
