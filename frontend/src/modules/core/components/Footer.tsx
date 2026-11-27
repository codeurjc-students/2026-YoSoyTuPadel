import { Box, Stack, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';

const footerLinkSx = {
  color: '#cbd5e1',
  textDecoration: 'none',
  transition: 'color 200ms ease',
  '&:hover': { color: 'white' },
};

function Footer() {
  const { user, isAuthenticated } = useAuth();
  const role = user?.role.toUpperCase().replace(/^ROLE_/, '');
  const isCoach = role === 'COACH';
  const isAdmin = role === 'ADMIN';
  const isRegularUser = !isCoach && !isAdmin;

  return (
      <Box component="footer" sx={{ bgcolor: '#0b0b0c', color: 'white' }}>
        <Box
            sx={{
              mx: 'auto',
              display: 'grid',
              maxWidth: 1280,
              gap: 5,
              px: { xs: 2, sm: 3, lg: 4 },
              py: 6,
              gridTemplateColumns: { xs: '1fr', md: '1.5fr 1fr 1fr' },
            }}
        >
          <Box>
            <Box
                component={Link}
                to="/"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1.5,
                  borderRadius: 3,
                  color: 'inherit',
                  textDecoration: 'none',
                }}
            >
              <Box
                  component="span"
                  sx={{
                    display: 'grid',
                    width: 40,
                    height: 40,
                    placeItems: 'center',
                    borderRadius: 3,
                    bgcolor: '#e60012',
                    fontSize: 10,
                    fontWeight: 900,
                    letterSpacing: '0.05em',
                  }}
              >
                YSTP
              </Box>
              <Typography component="span" sx={{ fontSize: 14, fontWeight: 900, letterSpacing: '0.2em' }}>
                YOSOYTUPADEL
              </Typography>
            </Box>
            <Typography sx={{ mt: 2, maxWidth: 384, fontSize: 14, lineHeight: 1.6, color: '#94a3b8' }}>
              Juega, entrena y mejora. Todo lo que necesitas para disfrutar del pádel, en una sola academia.
            </Typography>
          </Box>

          {isRegularUser && (
              <Box>
                <Typography
                    component="h2"
                    sx={{
                      fontSize: 12,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.2em',
                      color: '#94a3b8',
                    }}
                >
                  Explora
                </Typography>
                <Stack spacing={1.5} sx={{ mt: 2, alignItems: 'flex-start', fontSize: 14 }}>
                  <Box component={Link} to="/courts" sx={footerLinkSx}>Reserva de pistas</Box>
                  <Box component={Link} to="/coaches" sx={footerLinkSx}>Entrenadores</Box>
                  <Box component={Link} to="/rackets" sx={footerLinkSx}>Catálogo de palas</Box>
                </Stack>
              </Box>
          )}

          {user && (
              <Box>
                <Typography
                    component="h2"
                    sx={{
                      fontSize: 12,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.2em',
                      color: '#94a3b8',
                    }}
                >
                  Tu cuenta
                </Typography>
                <Stack spacing={1.5} sx={{ mt: 2, alignItems: 'flex-start', fontSize: 14 }}>
                  <Box component={Link} to="/profile" sx={footerLinkSx}>Mi perfil</Box>
                  {isAuthenticated && role === 'USER' && <Box component={Link} to="/bookings" sx={footerLinkSx}>Mis reservas</Box>}
                  {isCoach && <Box component={Link} to="/coach-dashboard" sx={footerLinkSx}>Panel de entrenador</Box>}
                  {isAdmin && <Box component={Link} to="/admin" sx={footerLinkSx}>Panel de administración</Box>}
                </Stack>
              </Box>
          )}
        </Box>

        <Box sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <Box
              sx={{
                mx: 'auto',
                display: 'flex',
                maxWidth: 1280,
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { sm: 'center' },
                justifyContent: 'space-between',
                gap: 1,
                px: { xs: 2, sm: 3, lg: 4 },
                py: 2.5,
                fontSize: 12,
                color: '#64748b',
              }}
          >
            <span>© {new Date().getFullYear()} YoSoyTuPadel</span>
            <span>Hecho para disfrutar cada punto.</span>
          </Box>
        </Box>
      </Box>
  );
}

export default Footer;