import { render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import App from './App';
import { describe, test, expect, vi } from 'vitest';

interface CustomMatchers<R = unknown> {
    toBeInTheDocument(): R;
}
declare module 'vitest' {
    interface Assertion<T = any> extends CustomMatchers<T> {}
}

describe('Prueba de Integración Cliente - Servidor (API Real)', () => {
    test('Debería conectar con la API REST real y verificar que el flujo no se rompe', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        render(<App />);

        const catalogTitle = await screen.findByText('Catálogo de Palas', {}, { timeout: 5000 });
        expect(catalogTitle).toBeInTheDocument();

        await waitForElementToBeRemoved(() =>
                screen.queryByText(/cargando palas de la base de datos.../i),
            { timeout: 5000 }
        );

        consoleSpy.mockRestore();
    });
});