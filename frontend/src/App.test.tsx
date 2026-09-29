import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import RacketsPage from './modules/rackets/pages/RacketsPage';
import api from './service/api';
import { vi, describe, beforeEach, test, expect } from 'vitest';
import type { Mock } from 'vitest';

vi.mock('./service/api', () => ({
    default: {
        get: vi.fn(),
    },
}));

// Datos ficticios
const mockRackets = [
    {
        id: 1,
        brand: 'Bullpadel',
        name: 'Hack 03',
        stock: 3,
    },
    {
        id: 2,
        brand: 'Adidas',
        name: 'Metalbone 3.2',
        stock: 0,
    },
];

describe('Componente App - Catálogo de Palas', () => {
    // Limpiamos los mocks antes de cada test para que no interfieran entre sí
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('1. Debería mostrar el estado de carga inicial', () => {
        (api.get as Mock).mockReturnValue(new Promise(() => {}));

        render(<MemoryRouter><RacketsPage /></MemoryRouter>);

        expect(screen.getByText(/cargando palas de la base de datos.../i)).toBeInTheDocument();
    });

    test('2. Debería renderizar la lista de palas cuando la API responde con éxito', async () => {

        (api.get as Mock).mockResolvedValue({ data: mockRackets });

        render(<MemoryRouter><RacketsPage /></MemoryRouter>);

        const titleBullpadel = await screen.findByText('Bullpadel - Hack 03');
        expect(titleBullpadel).toBeInTheDocument();

        expect(screen.getByText('Adidas - Metalbone 3.2')).toBeInTheDocument();
        expect(screen.getByText('3 palas disponibles')).toBeInTheDocument();
        expect(screen.getByText('Agotada')).toBeInTheDocument();
        expect(screen.getByRole('img', { name: 'Bullpadel Hack 03' }))
            .toHaveAttribute('src', '/api/v1/rackets/1/image');

        expect(screen.queryByText(/cargando palas/i)).not.toBeInTheDocument();
    });

    test('muestra un fallback cuando no se puede cargar una imagen', async () => {
        (api.get as Mock).mockResolvedValue({ data: mockRackets });
        render(<MemoryRouter><RacketsPage /></MemoryRouter>);

        fireEvent.error(await screen.findByRole('img', { name: 'Bullpadel Hack 03' }));

        expect(screen.queryByRole('img', { name: 'Bullpadel Hack 03' })).not.toBeInTheDocument();
        expect(screen.getAllByText('Bullpadel').length).toBeGreaterThan(0);
    });

    test('3. Debería mostrar un mensaje de error si la API falla', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        // Simulamos un fallo en la petición
        (api.get as Mock).mockRejectedValue(new Error('Network Error'));

        render(<MemoryRouter><RacketsPage /></MemoryRouter>);

        const errorMessage = await screen.findByText('No se ha podido conectar con el servidor.');
        expect(errorMessage).toBeInTheDocument();

        // Verificamos que no se renderice ninguna lista vacía de palas
        expect(screen.queryByRole('list')).not.toBeInTheDocument();
        consoleSpy.mockRestore();
    });
});