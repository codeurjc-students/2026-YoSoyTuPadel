import { Box } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { Outlet, useLocation } from 'react-router-dom';
import Footer from './Footer';
import Navbar from './Navbar';

function Layout() {
  const location = useLocation();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', flexDirection: 'column', bgcolor: '#0b0b0c' }}>
      <Navbar />
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
            style={{
              flex: 1,
              backgroundImage:
              'radial-gradient(ellipse at top right, rgba(230, 0, 18, 0.18), transparent 42%), radial-gradient(ellipse at bottom left, rgba(120, 0, 12, 0.2), transparent 46%), linear-gradient(145deg, #0b0b0c 0%, #171012 52%, #0b0b0c 100%)',
            }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      <Footer />
    </Box>
  );
}

export default Layout;