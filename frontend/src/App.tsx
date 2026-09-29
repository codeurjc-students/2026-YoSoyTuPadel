import { Route, Routes } from 'react-router-dom';
import Layout from './modules/core/components/Layout';
import ComingSoonPage from './modules/core/pages/ComingSoonPage';
import HomePage from './modules/core/pages/HomePage';
import RacketsPage from './modules/rackets/pages/RacketsPage';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="rackets" element={<RacketsPage />} />
        <Route path="courts" element={<ComingSoonPage title="Reserva de pistas" />} />
        <Route path="coaches" element={<ComingSoonPage title="Nuestros entrenadores" />} />
        <Route path="bookings" element={<ComingSoonPage title="Mis reservas" />} />
        <Route path="profile" element={<ComingSoonPage title="Mi perfil" />} />
        <Route path="login" element={<ComingSoonPage title="Iniciar sesión" />} />
        <Route path="*" element={<ComingSoonPage title="Página no encontrada" />} />
      </Route>
    </Routes>
  );
}

export default App;
