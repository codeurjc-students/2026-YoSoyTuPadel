import { useEffect, type ReactNode } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from './modules/core/components/Layout';
import ComingSoonPage from './modules/core/pages/ComingSoonPage';
import HomePage from './modules/core/pages/HomePage';
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

function RestrictCoachGuard({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isCoach = user?.role.toUpperCase().replace(/^ROLE_/, '') === 'COACH';

  useEffect(() => {
    if (!isCoach) {
      return;
    }

    toast.error('No tienes acceso a esta pantalla');
    navigate('/', { replace: true });
  }, [isCoach, navigate]);

  return isCoach ? null : <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="rackets" element={<RestrictCoachGuard><RacketsPage /></RestrictCoachGuard>} />
          <Route path="rackets/:id" element={<RestrictCoachGuard><RacketDetailPage /></RestrictCoachGuard>} />
          <Route path="courts" element={<RestrictCoachGuard><CourtListPage /></RestrictCoachGuard>} />
          <Route path="courts/:id" element={<RestrictCoachGuard><CourtDetailPage /></RestrictCoachGuard>} />
          <Route path="coaches" element={<RestrictCoachGuard><CoachListPage /></RestrictCoachGuard>} />
          <Route path="coaches/:id" element={<RestrictCoachGuard><CoachDetailPage /></RestrictCoachGuard>} />
          <Route path="bookings" element={<RestrictCoachGuard><MyBookingsPage /></RestrictCoachGuard>} />
          <Route path="profile" element={<UserProfilePage />} />
          <Route path="admin" element={<AdminDashboardPage />} />
          <Route path="coach-dashboard" element={<CoachDashboardPage />} />
          <Route path="login" element={<AuthPage />} />
          <Route path="*" element={<ComingSoonPage title="Página no encontrada" />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
