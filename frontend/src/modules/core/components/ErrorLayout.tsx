import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import PadelBallField from './PadelBallField';

function ErrorLayout({ children }: { children: ReactNode }) {
  return (
    <Box
      component="main"
      sx={{
        position: 'relative',
        minHeight: '100vh',
        overflow: 'hidden',
        bgcolor: '#0b0b0c',
      }}
    >
      <Box
        component="header"
        sx={{ position: 'absolute', top: 0, left: 0, zIndex: 2, p: { xs: 3, sm: 5 } }}
      >
        <Box
          component={Link}
          to="/"
          aria-label="YoSoyTuPadel, inicio"
          sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5, color: 'common.white', textDecoration: 'none' }}
        >
          <Box sx={{ width: 48, height: 48, display: 'grid', placeItems: 'center', borderRadius: 3, bgcolor: 'error.main', fontSize: 12, fontWeight: 900, letterSpacing: 1, boxShadow: '0 10px 28px rgba(230,0,18,.3)' }}>
            YSTP
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 900, letterSpacing: 2.5, fontSize: 14 }}>YOSOYTUPADEL</Typography>
            <Typography sx={{ color: 'error.light', fontWeight: 800, letterSpacing: 2.5, fontSize: 9, textTransform: 'uppercase' }}>
              Academia · App
            </Typography>
          </Box>
        </Box>
      </Box>
      <PadelBallField />
      <Box sx={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 3, py: 12 }}>
        {children}
      </Box>
    </Box>
  );
}

export default ErrorLayout;
