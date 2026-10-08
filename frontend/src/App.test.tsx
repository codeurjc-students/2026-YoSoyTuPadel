import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import App from './App';
import { useAuth } from './modules/auth/hooks/useAuth';

// 1. Mock the provider so it doesn't interfere with the simulated state in tests
vi.mock('./modules/auth/context/AuthProvider', () => ({
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// 2. Mock the auth hook to control roles dynamically
vi.mock('./modules/auth/hooks/useAuth', () => ({
    useAuth: vi.fn(),
}));

// 3. Mock pages to isolate the test exclusively to routing and RoleGuard
vi.mock('./modules/core/pages/HomePage', () => ({ default: () => <h1>Home Page</h1> }));
vi.mock('./modules/rackets/pages/RacketsPage', () => ({ default: () => <h1>Rackets Catalog</h1> }));
vi.mock('./modules/admin/pages/AdminDashboardPage', () => ({ default: () => <h1>Admin Dashboard</h1> }));
vi.mock('./modules/bookings/pages/MyBookingsPage', () => ({ default: () => <h1>My Bookings</h1> }));
vi.mock('./modules/core/pages/ForbiddenPage', () => ({ default: () => <h1>403 - Forbidden</h1> }));
vi.mock('./modules/core/pages/NotFoundPage', () => ({ default: () => <h1>404 - Not Found</h1> }));

// Helper to configure the authentication state and render the initial route
const renderApp = (initialRoute: string, role: string | null = null) => {
    vi.mocked(useAuth).mockReturnValue({
        user: role ? { id: 1, name: 'Test User', nickname: 'testuser', email: 'test@test.com', role } : null,
        isAuthenticated: !!role,
        isLoading: false,
        error: null,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
        updateUser: vi.fn(),
    });

    return render(
        <MemoryRouter initialEntries={[initialRoute]}>
            <App />
        </MemoryRouter>
    );
};

describe('App Router and RoleGuard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('renders the public HomePage route by default', () => {
        renderApp('/');
        expect(screen.getByRole('heading', { name: 'Home Page' })).toBeInTheDocument();
    });

    test('allows GUEST access to public routes like the rackets catalog', () => {
        renderApp('/rackets', null);
        expect(screen.getByRole('heading', { name: 'Rackets Catalog' })).toBeInTheDocument();
    });

    test('redirects to /403 when an unauthorized user tries to access a protected route', async () => {
        // A standard user tries to enter the admin dashboard
        renderApp('/admin', 'ROLE_USER');

        // Verify that RoleGuard intercepts the route and redirects to ForbiddenPage
        await waitFor(() => {
            expect(screen.getByRole('heading', { name: '403 - Forbidden' })).toBeInTheDocument();
        });
        expect(screen.queryByRole('heading', { name: 'Admin Dashboard' })).not.toBeInTheDocument();
    });

    test('allows access to protected routes if the role matches', () => {
        // An administrator accesses the admin dashboard
        renderApp('/admin', 'ROLE_ADMIN');
        expect(screen.getByRole('heading', { name: 'Admin Dashboard' })).toBeInTheDocument();
    });

    test('allows access to USER exclusive routes', () => {
        renderApp('/bookings', 'ROLE_USER');
        expect(screen.getByRole('heading', { name: 'My Bookings' })).toBeInTheDocument();
    });

    test('renders the 404 page for non-existent routes', () => {
        renderApp('/fake-route-that-does-not-exist');
        expect(screen.getByRole('heading', { name: '404 - Not Found' })).toBeInTheDocument();
    });
});