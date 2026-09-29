import { Link } from 'react-router-dom';

interface ComingSoonPageProps {
  title: string;
}

function ComingSoonPage({ title }: ComingSoonPageProps) {
  return (
    <section className="mx-auto flex min-h-[55vh] max-w-3xl flex-col items-center justify-center px-4 py-16 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-red-50 text-2xl font-black text-brand-red">YSTP</span>
      <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-brand-red">Estamos preparando la pista</p>
      <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">{title}</h1>
      <p className="mt-4 max-w-lg text-sm leading-6 text-slate-300">
        Esta sección se incorporará en una próxima entrega. Mientras tanto, puedes explorar el catálogo de palas.
      </p>
      <Link
        to="/rackets"
        className="mt-7 rounded-2xl bg-brand-red px-6 py-3 text-sm font-bold text-white shadow-red transition hover:-translate-y-0.5 hover:bg-red-600 active:scale-[0.98]"
      >
        Explorar palas
      </Link>
    </section>
  );
}

export default ComingSoonPage;
