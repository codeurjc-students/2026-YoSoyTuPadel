import { Route, Routes } from 'react-router-dom';
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

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="rackets" element={<RacketsPage />} />
          <Route path="rackets/:id" element={<RacketDetailPage />} />
          <Route path="courts" element={<CourtListPage />} />
          <Route path="courts/:id" element={<CourtDetailPage />} />
          <Route path="coaches" element={<CoachListPage />} />
          <Route path="coaches/:id" element={<CoachDetailPage />} />
          <Route path="bookings" element={<MyBookingsPage />} />
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
