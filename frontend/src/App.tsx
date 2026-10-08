import { useEffect, type ReactNode } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import Layout from './modules/core/components/Layout';
import HomePage from './modules/core/pages/HomePage';
import NotFoundPage from './modules/core/pages/NotFoundPage';
import ServerErrorPage from './modules/core/pages/ServerErrorPage';
import ForbiddenPage from './modules/core/pages/ForbiddenPage';
import RacketsPage from './modules/rackets/pages/RacketsPage';
import RacketDetailPage from './modules/rackets/pages/RacketDetailPage';
import { AuthProvider } from './modules/auth/context/AuthProvider';
import AuthPage from './modules/auth/pages/AuthPage';
import CourtListPage from './modules/courts/pages/CourtListPage';
import CourtDetailPage from './modules/courts/pages/CourtDetailPage';
import CoachListPage from './modules/coaches/pages/CoachListPage';
import CoachDetailPage from './modules/coaches/pages/CoachDetailPage';
import MyBookingsPage from './modules/bookings/pages/MyBookingsPage';
import UserProfilePage from './modules/users/pages/UserProfilePage';
import AdminDashboardPage from './modules/admin/pages/AdminDashboardPage';
import CoachDashboardPage from './modules/coaches/pages/CoachDashboardPage';
import { useAuth } from './modules/auth/hooks/useAuth';

type UserRole = 'USER' | 'ADMIN' | 'COACH' | 'GUEST';

function RoleGuard({ children, allowedRoles }: { children: ReactNode; allowedRoles: UserRole[] }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const currentRole: UserRole = user
    ? user.role.toUpperCase().replace(/^ROLE_/, '') as UserRole
    : 'GUEST';
  const hasAccess = allowedRoles.includes(currentRole);

  useEffect(() => {
    if (hasAccess) {
      return;
    }

    void navigate('/403', { replace: true });
  }, [hasAccess, navigate]);

  return hasAccess ? <>{children}</> : null;
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="rackets" element={<RoleGuard allowedRoles={['USER', 'ADMIN', 'GUEST']}><RacketsPage /></RoleGuard>} />
          <Route path="rackets/:id" element={<RoleGuard allowedRoles={['USER', 'ADMIN']}><RacketDetailPage /></RoleGuard>} />
          <Route path="courts" element={<RoleGuard allowedRoles={['USER', 'ADMIN', 'GUEST']}><CourtListPage /></RoleGuard>} />
          <Route path="courts/:id" element={<RoleGuard allowedRoles={['USER', 'ADMIN']}><CourtDetailPage /></RoleGuard>} />
          <Route path="coaches" element={<RoleGuard allowedRoles={['USER', 'ADMIN', 'GUEST']}><CoachListPage /></RoleGuard>} />
          <Route path="coaches/:id" element={<RoleGuard allowedRoles={['USER', 'ADMIN']}><CoachDetailPage /></RoleGuard>} />
          <Route path="bookings" element={<RoleGuard allowedRoles={['USER']}><MyBookingsPage /></RoleGuard>} />
          <Route path="profile" element={<UserProfilePage />} />
          <Route path="admin" element={<RoleGuard allowedRoles={['ADMIN']}><AdminDashboardPage /></RoleGuard>} />
          <Route path="coach-dashboard" element={<RoleGuard allowedRoles={['COACH']}><CoachDashboardPage /></RoleGuard>} />
          <Route path="login" element={<AuthPage />} />
        </Route>
        <Route path="/500" element={<ServerErrorPage />} />
        <Route path="/403" element={<ForbiddenPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
