import { render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import RacketsPage from './modules/rackets/pages/RacketsPage';
import { describe, test, expect, vi } from 'vitest';

describe('Prueba de Integración Cliente - Servidor (API Real)', () => {
    test('Debería conectar con la API REST real y verificar que el flujo no se rompe', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        render(<MemoryRouter><RacketsPage /></MemoryRouter>);

        const catalogTitle = await screen.findByText('Catálogo de Palas', {}, { timeout: 5000 });
        expect(catalogTitle).toBeInTheDocument();

        await waitForElementToBeRemoved(() =>
                screen.queryByText(/cargando palas de la base de datos.../i),
            { timeout: 5000 }
        );

        consoleSpy.mockRestore();
    });
});