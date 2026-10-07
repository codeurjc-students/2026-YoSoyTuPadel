import { AnimatePresence, motion } from 'framer-motion';
import { Outlet, useLocation } from 'react-router-dom';
import Footer from './Footer';
import Navbar from './Navbar';

function Layout() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col bg-brand-canvas">
      <Navbar />
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          className="flex-1 bg-[radial-gradient(ellipse_at_top_right,rgba(230,0,18,0.18),transparent_42%),radial-gradient(ellipse_at_bottom_left,rgba(120,0,12,0.2),transparent_46%),linear-gradient(145deg,#0b0b0c_0%,#171012_52%,#0b0b0c_100%)]"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      <Footer />
    </div>
  );
}

export default Layout;
