import { useState } from 'react';
import {
    AppBar,
    Box,
    Button as MuiButton,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    Stack,
    Typography,
} from '@mui/material';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import type { AuthUser } from '../../auth/services/authService';

const links = [
  { to: '/courts', label: 'Pistas' },
  { to: '/coaches', label: 'Entrenadores' },
  { to: '/rackets', label: 'Palas' },
  { to: '/bookings', label: 'Mis reservas' },
];

function canAccessAdmin(user: AuthUser | null, isAuthenticated: boolean) {
  const role = user?.role.toUpperCase().replace(/^ROLE_/, '');
  return isAuthenticated && role === 'ADMIN';
}

function canAccessBookings(user: AuthUser | null, isAuthenticated: boolean) {
  const role = user?.role.toUpperCase().replace(/^ROLE_/, '');
  return isAuthenticated && (role === 'USER' || role === 'COACH');
}

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role.toUpperCase().replace(/^ROLE_/, '');
  const isCoach = isAuthenticated && role === 'COACH';
  const visibleLinks = canAccessBookings(user, isAuthenticated)
    ? links
    : links.filter((link) => link.to !== '/bookings');
  const adminLinkVisible = canAccessAdmin(user, isAuthenticated);
  const isAdmin = adminLinkVisible;
  const adminLinks = isAdmin
    ? links.filter((link) => link.to !== '/coaches' && link.to !== '/bookings')
      .concat({ to: '/admin', label: 'Panel de administración' })
    : isCoach
      ? [{ to: '/coach-dashboard', label: 'Panel de entrenador' }]
    : visibleLinks;

  const confirmLogout = async () => {
    setLogoutDialogOpen(false);
    setMenuOpen(false);
    void navigate('/', { replace: true });
    await logout();
  };

  const { pathname } = useLocation();
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/auth';

  return (
        <AppBar
            position="sticky"
            component="header"
            elevation={0}
            sx={{
                zIndex: (theme) => theme.zIndex.appBar,
                borderBottom: '1px solid rgba(232, 232, 235, 0.8)',
                bgcolor: 'rgba(255, 255, 255, 0.95)',
                color: '#111318',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
                backdropFilter: 'blur(8px)',
            }}
        >
        <Box
            sx={{
                mx: 'auto',
                display: 'flex',
                height: 72,
                width: '100%',
                maxWidth: 1280,
                alignItems: 'center',
                justifyContent: 'space-between',
                px: { xs: 2, sm: 3, lg: 4 },
            }}
        >
        <Box
          component={Link}
          to="/"
          aria-label="YoSoyTuPadel, inicio"
          onClick={() => setMenuOpen(false)}
          sx={{
             display: 'flex',
             alignItems: 'center',
             gap: 1.5,
             borderRadius: 3,
             textDecoration: 'none',
             '&:hover .brand-badge': {
              transform: 'rotate(-3deg) scale(1.05)',
          },
        }}
        >
        <Box
            component="span"
            className="brand-badge"
            sx={{
                display: 'grid',
                width: 44,
                height: 44,
                placeItems: 'center',
                borderRadius: 3,
                bgcolor: '#e60012',
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: '0.05em',
                color: 'white',
                boxShadow: '0 8px 20px rgba(230, 0, 18, 0.25)',
                transition: 'transform 300ms ease',
            }}
        >
            YSTP
        </Box>
        <Box component="span" sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography
                component="span"
                sx={{
                    fontSize: { xs: 14, sm: 16 },
                    fontWeight: 900,
                    letterSpacing: '0.2em',
                    color: '#111318',
                    lineHeight: 1.2,
                }}
            >
                YOSOYTUPADEL
            </Typography>
            <Typography
                component="span"
                sx={{
                    fontSize: 9,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.34em',
                    color: '#e60012',
                    lineHeight: 1.2,
                }}
            >
                Academia · App
            </Typography>
        </Box>
    </Box>

                <Box
                    component="nav"
                    aria-label="Navegación principal"
                    sx={{ display: { xs: 'none', lg: 'flex' }, alignItems: 'center', gap: 0.5 }}
                >
                    {adminLinks.map((link) => (
                        <Box
                            key={link.to}
                            component={NavLink}
                            to={link.to}
                            sx={{
                                borderRadius: 3,
                                px: 2,
                                py: 1.25,
                                fontSize: 14,
                                fontWeight: 700,
                                color: '#626875',
                                textDecoration: 'none',
                                transition: 'background-color 200ms ease, color 200ms ease',
                                '&:hover': {
                                    bgcolor: '#fef2f2',
                                    color: '#e60012',
                                },
                                '&.active': {
                                    bgcolor: '#fef2f2',
                                    color: '#e60012',
                                },
                            }}
                        >
                            {link.label}
                        </Box>
                    ))}
                </Box>

                <Box sx={{ display: { xs: 'none', lg: 'flex' }, alignItems: 'center', gap: 1.5 }}>
                    {isAuthenticated && (
                        <>
                            <IconButton
                                component={Link}
                                to="/profile"
                                aria-label="Ir a mi perfil"
                                sx={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 3,
                                    bgcolor: '#17191e',
                                    color: 'white',
                                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)',
                                    transition: 'transform 200ms ease, background-color 200ms ease, box-shadow 200ms ease',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        bgcolor: '#e60012',
                                        boxShadow: '0 8px 20px rgba(230, 0, 18, 0.25)',
                                    },
                                }}
                            >
                                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" width="20" height="20">
                                    <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
                                    <path d="M5.5 20c.7-3.2 3-5 6.5-5s5.8 1.8 6.5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                </svg>
                            </IconButton>
                            <IconButton
                                type="button"
                                aria-label="Cerrar sesión"
                                title="Cerrar sesión"
                                onClick={() => setLogoutDialogOpen(true)}
                                sx={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 3,
                                    bgcolor: '#e60012',
                                    color: 'white',
                                    boxShadow: '0 8px 20px rgba(230, 0, 18, 0.25)',
                                    transition: 'transform 200ms ease, background-color 200ms ease',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        bgcolor: '#c4000f',
                                    },
                                }}
                            >
                                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" width="20" height="20">
                                    <path d="M10 5H5v14h5M14 8l4 4-4 4m4-4H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </IconButton>
                        </>
                    )}
                    {!isAuthenticated && !isAuthPage && (
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                            <MuiButton
                                component={Link}
                                to="/login?mode=register"
                                sx={{
                                    borderRadius: 3,
                                    px: 2,
                                    py: 1.1,
                                    fontSize: 14,
                                    fontWeight: 800,
                                    textTransform: 'none',
                                    color: '#111318',
                                    '&:hover': {
                                        bgcolor: '#fef2f2',
                                        color: '#e60012',
                                    },
                                }}
                            >
                                Crear cuenta
                            </MuiButton>
                            <MuiButton
                                component={Link}
                                to="/login"
                                variant="contained"
                                sx={{
                                    borderRadius: 3,
                                    bgcolor: '#e60012',
                                    px: 2,
                                    py: 1.1,
                                    fontSize: 14,
                                    fontWeight: 800,
                                    textTransform: 'none',
                                    color: 'white',
                                    boxShadow: '0 8px 20px rgba(230, 0, 18, 0.22)',
                                    transition: 'transform 200ms ease, background-color 200ms ease',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        bgcolor: '#c4000f',
                                    },
                                }}
                            >
                                Iniciar sesión
                            </MuiButton>
                        </Stack>
                    )}
                </Box>

                <IconButton
                    type="button"
                    aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
                    aria-expanded={menuOpen}
                    aria-controls="mobile-navigation"
                    onClick={() => setMenuOpen((open) => !open)}
                    sx={{
                        display: { xs: 'grid', lg: 'none' },
                        width: 44,
                        height: 44,
                        placeItems: 'center',
                        borderRadius: 3,
                        border: '1px solid #e8e8eb',
                        color: '#17191e',
                        '&:hover': {
                            borderColor: '#e60012',
                            color: '#e60012',
                            bgcolor: 'transparent',
                        },
                    }}
                >
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" width="20" height="20">
                        {menuOpen ? (
                            <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        ) : (
                            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        )}
                    </svg>
                </IconButton>
            </Box>

            {menuOpen && (
                <Box
                    component="nav"
                    id="mobile-navigation"
                    aria-label="Navegación móvil"
                    sx={{
                        display: { xs: 'block', lg: 'none' },
                        borderTop: '1px solid #e8e8eb',
                        bgcolor: 'white',
                        px: 2,
                        py: 1.5,
                        boxShadow: '0 12px 32px rgba(17, 19, 24, 0.08)',
                    }}
                >
                    <Stack spacing={0.5} sx={{ mx: 'auto', maxWidth: 1280 }}>
                        {adminLinks.map((link) => (
                            <Box
                                key={link.to}
                                component={NavLink}
                                to={link.to}
                                onClick={() => setMenuOpen(false)}
                                sx={{
                                    borderRadius: 3,
                                    px: 2,
                                    py: 1.5,
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: '#626875',
                                    textDecoration: 'none',
                                    '&:hover': {
                                        bgcolor: '#fef2f2',
                                        color: '#e60012',
                                    },
                                    '&.active': {
                                        bgcolor: '#fef2f2',
                                        color: '#e60012',
                                    },
                                }}
                            >
                                {link.label}
                            </Box>
                        ))}
                        {isAuthenticated && (
                            <>
                                <Box
                                    component={Link}
                                    to="/profile"
                                    onClick={() => setMenuOpen(false)}
                                    sx={{
                                        borderRadius: 3,
                                        px: 2,
                                        py: 1.5,
                                        fontSize: 14,
                                        fontWeight: 700,
                                        color: '#626875',
                                        textDecoration: 'none',
                                        '&:hover': {
                                            bgcolor: '#fef2f2',
                                            color: '#e60012',
                                        },
                                    }}
                                >
                                    Mi perfil
                                </Box>
                                <Box
                                    component="button"
                                    type="button"
                                    onClick={() => setLogoutDialogOpen(true)}
                                    sx={{
                                        border: 0,
                                        bgcolor: 'transparent',
                                        borderRadius: 3,
                                        px: 2,
                                        py: 1.5,
                                        textAlign: 'left',
                                        fontFamily: 'inherit',
                                        fontSize: 14,
                                        fontWeight: 800,
                                        color: '#e60012',
                                        cursor: 'pointer',
                                        '&:hover': {
                                            bgcolor: '#fef2f2',
                                        },
                                    }}
                                >
                                    Cerrar sesión
                                </Box>
                            </>
                        )}
                        {!isAuthenticated && !isAuthPage && (
                            <>
                                <Box
                                    component={Link}
                                    to="/login"
                                    onClick={() => setMenuOpen(false)}
                                    sx={{
                                        borderRadius: 3,
                                        px: 2,
                                        py: 1.5,
                                        fontSize: 14,
                                        fontWeight: 800,
                                        color: '#e60012',
                                        textDecoration: 'none',
                                        '&:hover': {
                                            bgcolor: '#fef2f2',
                                        },
                                    }}
                                >
                                    Iniciar sesión
                                </Box>
                                <Box
                                    component={Link}
                                    to="/login?mode=register"
                                    onClick={() => setMenuOpen(false)}
                                    sx={{
                                        borderRadius: 3,
                                        px: 2,
                                        py: 1.5,
                                        fontSize: 14,
                                        fontWeight: 700,
                                        color: '#626875',
                                        textDecoration: 'none',
                                        '&:hover': {
                                            bgcolor: '#fef2f2',
                                            color: '#e60012',
                                        },
                                    }}
                                >
                                    Crear cuenta
                                </Box>
                            </>
                        )}
                    </Stack>
                </Box>
            )}

            <Dialog
                open={logoutDialogOpen}
                onClose={() => setLogoutDialogOpen(false)}
                fullWidth
                maxWidth="xs"
                aria-labelledby="logout-dialog-title"
                aria-describedby="logout-dialog-description"
                slotProps={{ paper: { sx: { borderRadius: 4, p: 0.5, m: { xs: 2, sm: 4 } } } }}
            >
                <DialogTitle id="logout-dialog-title" sx={{ px: { xs: 2.5, sm: 3 }, pt: 2.5, pb: 1, fontWeight: 900 }}>
                    ¿Cerrar sesión?
                </DialogTitle>
                <DialogContent sx={{ px: { xs: 2.5, sm: 3 }, pb: 1.5 }}>
                    <DialogContentText id="logout-dialog-description" sx={{ color: 'grey.700' }}>
                        ¿Estás seguro de que deseas cerrar sesión?
                    </DialogContentText>
                </DialogContent>
                <DialogActions
                    sx={{
                        px: { xs: 2.5, sm: 3 },
                        pb: 2.5,
                        pt: 1,
                        gap: 1.25,
                        flexDirection: { xs: 'column-reverse', sm: 'row' },
                        '& > :not(style) ~ :not(style)': { ml: { xs: 0, sm: 1.25 } },
                    }}
                >
                    <MuiButton
                        onClick={() => setLogoutDialogOpen(false)}
                        disabled={isLoading}
                        variant="outlined"
                        color="inherit"
                        sx={{
                            width: { xs: '100%', sm: 'auto' },
                            borderRadius: 3,
                            borderColor: 'grey.300',
                            color: 'grey.800',
                            textTransform: 'none',
                            fontWeight: 700,
                            px: 2.5,
                            py: 0.9,
                        }}
                    >
                        Cancelar
                    </MuiButton>
                    <MuiButton
                        onClick={() => void confirmLogout()}
                        disabled={isLoading}
                        variant="contained"
                        sx={{
                            width: { xs: '100%', sm: 'auto' },
                            borderRadius: 3,
                            bgcolor: '#e60012',
                            boxShadow: '0 8px 20px rgba(230,0,18,.22)',
                            '&:hover': { bgcolor: '#c4000f' },
                            fontWeight: 800,
                            textTransform: 'none',
                            px: 2.5,
                            py: 0.9,
                        }}
                    >
                        {isLoading ? 'Cerrando…' : 'Sí, cerrar sesión'}
                    </MuiButton>
                </DialogActions>
            </Dialog>
        </AppBar>
    );
}

export default Navbar;