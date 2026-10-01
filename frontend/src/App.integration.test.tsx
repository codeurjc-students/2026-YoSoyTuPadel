import { render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import RacketsPage from './modules/rackets/pages/RacketsPage';
import { describe, test, expect, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from './modules/auth/context/authContext';

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

describe('Prueba de Integración Cliente - Servidor (API Real)', () => {
    test('Debería conectar con la API REST real y verificar que el flujo no se rompe', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        render(
            <MemoryRouter>
                <AuthContext.Provider value={guestAuth}>
                    <RacketsPage />
                </AuthContext.Provider>
            </MemoryRouter>,
        );

        const catalogTitle = await screen.findByText('Catálogo de Palas', {}, { timeout: 5000 });
        expect(catalogTitle).toBeInTheDocument();

        await waitForElementToBeRemoved(() =>
                screen.queryByText(/cargando palas de la base de datos.../i),
            { timeout: 5000 }
        );

        consoleSpy.mockRestore();
    });
});