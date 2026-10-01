import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import RacketsPage from './modules/rackets/pages/RacketsPage';
import api from './service/api';
import { vi, describe, beforeEach, test, expect } from 'vitest';
import type { Mock } from 'vitest';
import { AuthContext, type AuthContextValue } from './modules/auth/context/authContext';

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
const mockRacketPage = {
    content: mockRackets,
    number: 0,
    size: 10,
    totalElements: mockRackets.length,
    totalPages: 1,
    last: true,
};

const guestAuth: AuthContextValue = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    clearError: vi.fn(),
};

function renderRacketsPage() {
    return render(
        <MemoryRouter>
            <AuthContext.Provider value={guestAuth}>
                <RacketsPage />
            </AuthContext.Provider>
        </MemoryRouter>,
    );
}

describe('Componente App - Catálogo de Palas', () => {
    // Limpiamos los mocks antes de cada test para que no interfieran entre sí
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('1. Debería mostrar el estado de carga inicial', () => {
        (api.get as Mock).mockReturnValue(new Promise(() => {}));

        renderRacketsPage();

        expect(screen.getByText(/cargando palas de la base de datos.../i)).toBeInTheDocument();
    });

    test('2. Debería renderizar la lista de palas cuando la API responde con éxito', async () => {

        (api.get as Mock).mockResolvedValue({ data: mockRacketPage });

        renderRacketsPage();

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
        (api.get as Mock).mockResolvedValue({ data: mockRacketPage });
        renderRacketsPage();

        fireEvent.error(await screen.findByRole('img', { name: 'Bullpadel Hack 03' }));

        expect(screen.queryByRole('img', { name: 'Bullpadel Hack 03' })).not.toBeInTheDocument();
        expect(screen.getAllByText('Bullpadel').length).toBeGreaterThan(0);
    });

    test('3. Debería mostrar un mensaje de error si la API falla', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        // Simulamos un fallo en la petición
        (api.get as Mock).mockRejectedValue(new Error('Network Error'));

        renderRacketsPage();

        const errorMessage = await screen.findByText('No se ha podido conectar con el servidor.');
        expect(errorMessage).toBeInTheDocument();

        // Verificamos que no se renderice ninguna lista vacía de palas
        expect(screen.queryByRole('list')).not.toBeInTheDocument();
        consoleSpy.mockRestore();
    });

    test('invita a visitantes a iniciar sesión para ver detalles y reservar', async () => {
        (api.get as Mock).mockResolvedValue({ data: mockRacketPage });
        renderRacketsPage();

        expect(await screen.findAllByRole('link', { name: 'Inicia sesión para reservar' })).toHaveLength(2);
    });

    test('loads the next racket page and hides the button when there are no more results', async () => {
        const firstPageContent = Array.from({ length: 10 }, (_, index) => ({
            id: index + 1,
            brand: 'Brand',
            name: `Model ${index + 1}`,
            stock: 1,
        }));
        (api.get as Mock).mockImplementation((_url: string, config: { params: { page: number } }) =>
            Promise.resolve({
                data: config.params.page === 0
                    ? { ...mockRacketPage, content: firstPageContent, last: false, totalElements: 11, totalPages: 2 }
                    : {
                        content: [{ id: 11, brand: 'Brand', name: 'Model 11', stock: 1 }],
                        number: 1,
                        size: 10,
                        totalElements: 11,
                        totalPages: 2,
                        last: true,
                    },
            }),
        );

        renderRacketsPage();
        expect(await screen.findByText('Brand - Model 10')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Más resultados' }));

        expect(await screen.findByText('Brand - Model 11')).toBeInTheDocument();
        await waitFor(() => expect(screen.queryByRole('button', { name: 'Más resultados' })).not.toBeInTheDocument());
        expect(api.get).toHaveBeenNthCalledWith(1, '/api/v1/rackets', {
            params: { page: 0, size: 10 },
            signal: expect.any(AbortSignal),
        });
        expect(api.get).toHaveBeenNthCalledWith(2, '/api/v1/rackets', {
            params: { page: 1, size: 10 },
            signal: undefined,
        });
    });

    test('shows the total number of models, not only those in the current page', async () => {
        const firstPageContent = Array.from({ length: 10 }, (_, index) => ({
            id: index + 1,
            brand: 'Brand',
            name: `Model ${index + 1}`,
            stock: 1,
        }));
        (api.get as Mock).mockResolvedValue({
            data: {
                content: firstPageContent,
                number: 0,
                size: 10,
                totalElements: 30,
                totalPages: 3,
                last: false,
            },
        });

        renderRacketsPage();

        expect(await screen.findByText('30 modelos')).toBeInTheDocument();
        expect(screen.getByText('Brand - Model 10')).toBeInTheDocument();
    });
});