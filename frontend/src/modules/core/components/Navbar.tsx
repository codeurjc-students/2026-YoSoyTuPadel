import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';

const links = [
  { to: '/courts', label: 'Pistas' },
  { to: '/coaches', label: 'Entrenadores' },
  { to: '/rackets', label: 'Palas' },
  { to: '/bookings', label: 'Mis reservas' },
];

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutConfirmationOpen, setLogoutConfirmationOpen] = useState(false);
  const { isAuthenticated, isLoading, logout } = useAuth();

  const confirmLogout = async () => {
    const loggedOut = await logout();
    if (loggedOut) {
      setLogoutConfirmationOpen(false);
      setMenuOpen(false);
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
          {links.map((link) => (
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
              <button
                type="button"
                disabled
                aria-label="Perfil próximamente"
                className="rounded-xl border border-brand-line px-4 py-2.5 text-sm font-semibold text-brand-ink opacity-70"
              >
                Perfil
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => setLogoutConfirmationOpen(true)}
                className="rounded-xl bg-brand-ink px-4 py-2.5 text-sm font-bold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-brand-red active:scale-95 disabled:cursor-wait disabled:opacity-70"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="rounded-xl bg-brand-red px-5 py-2.5 text-sm font-bold text-white shadow-red transition duration-200 hover:-translate-y-0.5 hover:bg-red-600 active:scale-95"
            >
              Iniciar sesión
            </Link>
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
            {links.map((link) => (
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
                <button
                  type="button"
                  disabled
                  className="rounded-xl px-4 py-3 text-left text-sm font-semibold text-brand-muted opacity-70"
                >
                  Perfil (próximamente)
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => {
                    setLogoutConfirmationOpen(true);
                  }}
                  className="rounded-xl px-4 py-3 text-left text-sm font-semibold text-brand-muted transition-colors hover:bg-red-50 hover:text-brand-red disabled:opacity-70"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="mt-1 rounded-xl bg-brand-red px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-red-600"
              >
                Iniciar sesión
              </Link>
            )}
          </div>
        </nav>
      )}

      </header>
      {logoutConfirmationOpen && createPortal(
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/55 p-4 backdrop-blur-sm"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget && !isLoading) {
            setLogoutConfirmationOpen(false);
          }
        }}
      >
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-confirmation-title"
          className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-brand-line bg-white p-6 shadow-2xl sm:p-8"
        >
          <h2 id="logout-confirmation-title" className="text-xl font-black text-brand-ink">
            ¿Estás seguro de que deseas cerrar sesión?
          </h2>
          <p className="mt-2 text-sm leading-6 text-brand-muted">
            Tendrás que iniciar sesión de nuevo para acceder a tu cuenta.
          </p>
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => setLogoutConfirmationOpen(false)}
              className="rounded-xl border border-brand-line px-4 py-2.5 text-sm font-bold text-brand-ink transition hover:bg-slate-50 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => void confirmLogout()}
              className="rounded-xl bg-brand-red px-4 py-2.5 text-sm font-bold text-white shadow-red transition hover:bg-red-600 disabled:cursor-wait disabled:opacity-60"
            >
              {isLoading ? 'Cerrando sesión…' : 'Sí, cerrar sesión'}
            </button>
          </div>
        </section>
      </div>,
      document.body,
      )}
    </>
  );
}

export default Navbar;
