import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';

function Footer() {
  const { user, isAuthenticated } = useAuth();
  const role = user?.role.toUpperCase().replace(/^ROLE_/, '');
  const canViewBookings = isAuthenticated && (role === 'USER' || role === 'COACH');

  return (
    <footer className="bg-brand-dark text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr] lg:px-8">
        <div>
          <Link to="/" className="inline-flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-red text-[10px] font-black tracking-wider">YSTP</span>
            <span className="text-sm font-black tracking-[0.2em]">YOSOYTUPADEL</span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-6 text-slate-400">
            Juega, entrena y mejora. Todo lo que necesitas para disfrutar del pádel, en una sola academia.
          </p>
        </div>

        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Explora</h2>
          <div className="mt-4 flex flex-col items-start gap-3 text-sm text-slate-300">
            <Link className="transition hover:text-white" to="/courts">Reserva de pistas</Link>
            <Link className="transition hover:text-white" to="/coaches">Entrenadores</Link>
            <Link className="transition hover:text-white" to="/rackets">Catálogo de palas</Link>
          </div>
        </div>

        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Tu cuenta</h2>
          <div className="mt-4 flex flex-col items-start gap-3 text-sm text-slate-300">
            {canViewBookings && <Link className="transition hover:text-white" to="/bookings">Mis reservas</Link>}
            <Link className="transition hover:text-white" to="/profile">Mi perfil</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} YoSoyTuPadel</span>
          <span>Hecho para disfrutar cada punto.</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
