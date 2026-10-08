import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import RacketsPage from './pages/RacketsPage.tsx';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from '../auth/context/authContext.ts';
import { racketService } from './services/racketService.ts';

vi.mock('./services/racketService', () => ({
    racketService: { getRackets: vi.fn() },
}));

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

describe('Integration of the paddle catalog', () => {
    beforeEach(() => vi.clearAllMocks());

    test('loads the catalog for a visitor without relying on the actual API', async () => {
        vi.mocked(racketService.getRackets).mockResolvedValue({
            content: [{ id: 1, brand: 'Bullpadel', name: 'Vertex 04', stock: 2 }],
            number: 0,
            size: 10,
            totalElements: 1,
            totalPages: 1,
            last: true,
        });

        render(
            <MemoryRouter>
                <AuthContext.Provider value={guestAuth}>
                    <RacketsPage />
                </AuthContext.Provider>
            </MemoryRouter>,
        );

        expect(await screen.findByRole('heading', { name: 'Bullpadel - Vertex 04' })).toBeInTheDocument();
        expect(racketService.getRackets).toHaveBeenCalledWith(0, 10, expect.any(AbortSignal));
    });
});