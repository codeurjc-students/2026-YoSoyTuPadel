import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ErrorLayout from '../components/ErrorLayout';

function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <ErrorLayout>
      <Box sx={{ maxWidth: 760, p: { xs: 3, sm: 6 }, textAlign: 'center', border: '1px solid rgba(255,255,255,.12)', borderRadius: 4, bgcolor: 'white', boxShadow: '0 24px 70px rgba(0,0,0,.3)' }}>
        <Typography variant="h1" sx={{ color: '#000000', fontWeight: 900 }}>Acceso denegado (403)</Typography>
        <Typography variant="h6" sx={{ color: '#000000', mt: 2 }}>
          El árbitro ha pitado falta. No tienes los permisos necesarios para entrar en esta zona de la pista.
        </Typography>
        <Button sx={{ mt: 4 }} variant="contained" color="error" onClick={() => navigate('/')}>Volver al inicio</Button>
      </Box>
    </ErrorLayout>
  );
}

export default ForbiddenPage;
