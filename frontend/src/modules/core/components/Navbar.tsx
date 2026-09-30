import { useState } from 'react';
import { Button as MuiButton, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import type { AuthUser } from '../../auth/services/authService';

const links = [
  { to: '/courts', label: 'Pistas' },
  { to: '/coaches', label: 'Entrenadores' },
  { to: '/rackets', label: 'Palas' },
  { to: '/bookings', label: 'Mis reservas' },
];

function canAccessBookings(user: AuthUser | null, isAuthenticated: boolean) {
  const role = user?.role.toUpperCase().replace(/^ROLE_/, '');
  return isAuthenticated && (role === 'USER' || role === 'COACH');
}

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const visibleLinks = canAccessBookings(user, isAuthenticated)
    ? links
    : links.filter((link) => link.to !== '/bookings');

  const confirmLogout = async () => {
    if (await logout()) {
      setLogoutDialogOpen(false);
      setMenuOpen(false);
      navigate('/', { replace: true });
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-brand-line/80 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          aria-label="YoSoyTuPadel, inicio"
          className="group flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red"
          onClick={() => setMenuOpen(false)}
        >
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-red text-xs font-black tracking-wider text-white shadow-red transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105">
            YSTP
          </span>
          <span className="flex flex-col">
            <span className="text-sm font-black tracking-[0.2em] text-brand-dark sm:text-base">YOSOYTUPADEL</span>
            <span className="text-[9px] font-bold uppercase tracking-[0.34em] text-brand-red">Academia · App</span>
          </span>
        </Link>

        <nav aria-label="Navegación principal" className="hidden items-center gap-1 lg:flex">
          {visibleLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors duration-200 hover:bg-red-50 hover:text-brand-red ${
                  isActive ? 'bg-red-50 text-brand-red' : 'text-brand-muted'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {isAuthenticated ? (
            <>
              <Link
                to="/profile"
                aria-label="Ir a mi perfil"
                className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-ink text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-brand-red hover:shadow-red active:scale-95"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                  <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M5.5 20c.7-3.2 3-5 6.5-5s5.8 1.8 6.5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </Link>
              <button
                type="button"
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
                onClick={() => setLogoutDialogOpen(true)}
                className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-red text-white shadow-red transition duration-200 hover:-translate-y-0.5 hover:bg-red-700 active:scale-95"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                  <path d="M10 5H5v14h5M14 8l4 4-4 4m4-4H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login?mode=register"
                className="rounded-xl px-4 py-2.5 text-sm font-bold text-brand-dark transition-colors hover:bg-red-50 hover:text-brand-red"
              >
                Crear cuenta
              </Link>
              <Link
                to="/login"
                className="rounded-xl bg-brand-red px-4 py-2.5 text-sm font-bold text-white shadow-red transition hover:-translate-y-0.5 hover:bg-red-600 active:scale-95"
              >
                Iniciar sesión
              </Link>
            </div>
          )}
        </div>

        <button
          type="button"
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen((open) => !open)}
          className="grid h-11 w-11 place-items-center rounded-xl border border-brand-line text-brand-ink transition hover:border-brand-red hover:text-brand-red active:scale-95 lg:hidden"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            {menuOpen ? (
              <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <nav
          id="mobile-navigation"
          aria-label="Navegación móvil"
          className="border-t border-brand-line bg-white px-4 py-3 shadow-soft lg:hidden"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {visibleLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `rounded-xl px-4 py-3 text-sm font-semibold transition-colors hover:bg-red-50 hover:text-brand-red ${
                    isActive ? 'bg-red-50 text-brand-red' : 'text-brand-muted'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm font-semibold text-brand-muted transition-colors hover:bg-red-50 hover:text-brand-red"
                >
                  Mi perfil
                </Link>
                <button
                  type="button"
                  onClick={() => setLogoutDialogOpen(true)}
                  className="rounded-xl px-4 py-3 text-left text-sm font-bold text-brand-red transition-colors hover:bg-red-50"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm font-bold text-brand-red transition-colors hover:bg-red-50"
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/login?mode=register"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm font-semibold text-brand-muted transition-colors hover:bg-red-50 hover:text-brand-red"
                >
                  Crear cuenta
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        aria-labelledby="logout-dialog-title"
        aria-describedby="logout-dialog-description"
        slotProps={{ paper: { sx: { width: '100%', maxWidth: 420, m: 2, borderRadius: 3 } } }}
      >
        <DialogTitle id="logout-dialog-title" sx={{ fontWeight: 800 }}>
          ¿Cerrar sesión?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="logout-dialog-description">
            ¿Estás seguro de que deseas cerrar sesión?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <MuiButton onClick={() => setLogoutDialogOpen(false)} disabled={isLoading} color="inherit">
            Cancelar
          </MuiButton>
          <MuiButton onClick={() => void confirmLogout()} disabled={isLoading} variant="contained" color="error">
            {isLoading ? 'Cerrando…' : 'Sí, cerrar sesión'}
          </MuiButton>
        </DialogActions>
      </Dialog>
    </header>
    </>
  );
}

export default Navbar;
