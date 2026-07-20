import { render, screen } from '@testing-library/react';
import App from './App';
import api from './service/api';
import { vi, describe, beforeEach, test, expect } from 'vitest';
import type { Mock } from 'vitest';

interface CustomMatchers<R = unknown> {
    toBeInTheDocument(): R;
    toBeVisible(): R;
    toHaveTextContent(text: string | RegExp): R;

}

declare module 'vitest' {
    interface Assertion<T = any> extends CustomMatchers<T> {}
    interface AsymmetricMatchersContaining extends CustomMatchers {}
}

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
        description: 'Pala de potencia para jugadores avanzados.',
        pricePerDay: 15,
    },
    {
        id: 2,
        brand: 'Adidas',
        name: 'Metalbone 3.2',
        description: 'Pala con balance personalizable.',
        pricePerDay: 18,
    },
];

describe('Componente App - Catálogo de Palas', () => {
    // Limpiamos los mocks antes de cada test para que no interfieran entre sí
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('1. Debería mostrar el estado de carga inicial', () => {
        (api.get as Mock).mockReturnValue(new Promise(() => {}));

        render(<App />);

        expect(screen.getByText(/cargando palas de la base de datos.../i)).toBeInTheDocument();
    });

    test('2. Debería renderizar la lista de palas cuando la API responde con éxito', async () => {

        (api.get as Mock).mockResolvedValue({ data: mockRackets });

        render(<App />);

        const titleBullpadel = await screen.findByText('Bullpadel - Hack 03');
        expect(titleBullpadel).toBeInTheDocument();

        expect(screen.getByText('Adidas - Metalbone 3.2')).toBeInTheDocument();
        expect(screen.getByText('Precio de Alquiler: 15 € por sesión')).toBeInTheDocument();

        expect(screen.queryByText(/cargando palas/i)).not.toBeInTheDocument();
    });

    test('3. Debería mostrar un mensaje de error si la API falla', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        // Simulamos un fallo en la petición
        (api.get as Mock).mockRejectedValue(new Error('Network Error'));

        render(<App />);

        const errorMessage = await screen.findByText('No se ha podido conectar con el servidor.');
        expect(errorMessage).toBeInTheDocument();

        // Verificamos que no se renderice ninguna lista vacía de palas
        expect(screen.queryByRole('list')).not.toBeInTheDocument();
        consoleSpy.mockRestore();
    });
});