import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import api from '../../../service/api';
import { racketService } from '../../rackets/services/racketService';

const activities = [
  {
    eyebrow: 'Tu próximo partido',
    title: 'Reserva una pista',
    description: 'Encuentra un horario disponible y céntrate en el juego.',
    to: '/courts',
    action: 'Ver pistas',
    image: '/images/padel-court-overhead.jpg',
    visual: 'from-slate-700 via-slate-900 to-black',
  },
  {
    eyebrow: 'Mejora tu juego',
    title: 'Entrena con expertos',
    description: 'Descubre entrenadores certificados para todos los niveles.',
    to: '/coaches',
    action: 'Ver entrenadores',
    image: '/images/coach-training.jpg',
    visual: 'from-red-950 via-brand-dark to-black',
  },
  {
    eyebrow: 'Prueba algo nuevo',
    title: 'Elige tu pala',
    description: 'Explora el catálogo y encuentra tu próxima compañera de pista.',
    to: '/rackets',
    action: 'Explorar palas',
    image: '/images/racket-collection.jpg',
    visual: 'from-zinc-700 via-brand-dark to-black',
  },
];

interface HomeStats {
  courts: number | null;
  coaches: number | null;
  rackets: number | null;
}

const statLabels: { key: keyof HomeStats; label: string }[] = [
  { key: 'courts', label: 'Pistas' },
  { key: 'coaches', label: 'Entrenadores' },
  { key: 'rackets', label: 'Palas disponibles' },
];

async function getTotalRacketStock(signal: AbortSignal): Promise<number> {
  let page = 0;
  let totalStock = 0;
  let last = false;

  while (!last) {
    const result = await racketService.getRackets(page, 10, signal);
    totalStock += result.content.reduce((total, racket) => total + (racket.stock ?? 0), 0);
    last = result.last;
    page += 1;
  }

  return totalStock;
}

function HomePage() {
  const [stats, setStats] = useState<HomeStats | null>(null);
  const today = new Date();
  const formattedDate = new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
  }).format(today);

  useEffect(() => {
    const controller = new AbortController();
    const options = { signal: controller.signal };
    const statsRequests = Promise.allSettled([
      api.get<{ totalElements: number }>('/api/v1/courts', options),
      api.get<{ totalElements: number }>('/api/v1/users/coaches', options),
      getTotalRacketStock(controller.signal),
    ]);

    void statsRequests.then(([courts, coaches, rackets]) => {
      if (controller.signal.aborted) {
        return;
      }

      setStats({
        courts: courts.status === 'fulfilled' ? courts.value.data.totalElements : null,
        coaches: coaches.status === 'fulfilled' ? coaches.value.data.totalElements : null,
        rackets: rackets.status === 'fulfilled' ? rackets.value : null,
      });
    });

    return () => controller.abort();
  }, []);

  return (
    <div>
      <section className="relative isolate overflow-hidden text-white">
        <div aria-hidden="true" className="absolute -right-24 -top-40 -z-10 h-[28rem] w-[28rem] rounded-full bg-brand-red/15 blur-3xl" />
        <div aria-hidden="true" className="absolute -bottom-64 left-1/3 -z-10 h-[30rem] w-[30rem] rounded-full border-[70px] border-white/[0.03]" />
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:px-8 lg:py-24">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="mb-5 inline-flex flex-wrap items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-semibold uppercase tracking-[0.17em] text-slate-300"
            >
              <span className="h-2 w-2 rounded-full bg-brand-red" />
              <time
                dateTime={today.toISOString().slice(0, 10)}
                className="ml-1 text-[10px] font-bold tracking-[0.14em] text-slate-400"
              >
                {formattedDate}
              </time>
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.05 }}
              className="max-w-3xl text-5xl font-black leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl"
            >
              Juega.
              <br />
              <span className="text-brand-red">Entrena.</span>
              <br />
              Mejora.
            </motion.h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              Organiza tu experiencia de pádel en un mismo lugar. Reserva pistas, encuentra entrenador y descubre material para tu próximo partido.
            </p>
          </div>

          <motion.aside
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="relative overflow-hidden rounded-4xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur sm:p-8"
          >
            <div aria-hidden="true" className="absolute -right-10 -top-10 h-44 w-44 rounded-full border-[24px] border-brand-red/20" />
            <div className="relative">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-red">YoSoyTuPadel</p>
              <h2 className="mt-4 text-2xl font-bold leading-tight sm:text-3xl">Todo empieza con el siguiente punto.</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">Elige qué te apetece hacer hoy y nosotros te ayudamos con el resto.</p>
              <div className="mt-8 grid grid-cols-3 gap-3">
                {statLabels.map(({ key, label }) => (
                  <div key={key} className="rounded-2xl border border-white/10 bg-black/20 p-3 sm:p-4">
                    {stats ? (
                      <p
                        aria-label={stats[key] === null ? `${label}: no disponible` : `${stats[key]} ${label.toLowerCase()}`}
                        className="text-xl font-black text-white sm:text-2xl"
                      >
                        {stats[key] ?? '—'}
                      </p>
                    ) : (
                      <span aria-label={`Cargando ${label.toLowerCase()}`} className="block h-7 w-10 animate-pulse rounded bg-white/15" />
                    )}
                    <p className="mt-1 text-[10px] leading-4 text-slate-400 sm:text-xs">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.aside>
        </div>
      </section>

      <section className="relative isolate mx-auto max-w-7xl overflow-hidden px-4 py-14 text-white sm:px-6 sm:py-16 lg:px-8">
        <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-red">Vamos a jugar</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">¿Qué necesitas hoy?</h2>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <time dateTime={today.toISOString().slice(0, 10)} className="text-sm font-semibold capitalize text-slate-300">
              {formattedDate}
            </time>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {activities.map((activity, index) => (
            <motion.article
              key={activity.to}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.08 }}
              whileHover={{ y: -5 }}
              className={`group relative isolate flex min-h-80 flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br ${activity.visual} p-6 text-white shadow-soft sm:p-7`}
            >
              <img
                src={activity.image}
                alt=""
                aria-hidden="true"
                className="absolute inset-x-0 top-0 -z-20 h-3/5 w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <span aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-black via-black/75 to-black/10 transition-colors duration-300 group-hover:from-black/95" />
              <span aria-hidden="true" className="absolute -right-9 -top-10 -z-10 h-44 w-44 rounded-full border-[30px] border-brand-red/15 transition-transform duration-500 group-hover:scale-110" />
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">{activity.eyebrow}</span>
              <div>
                <h3 className="text-2xl font-black">{activity.title}</h3>
                <p className="mt-2 max-w-xs text-sm leading-6 text-slate-300">{activity.description}</p>
                <Link
                  to={activity.to}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-red px-4 py-2.5 text-sm font-bold text-white transition duration-200 hover:bg-red-600 active:scale-95"
                >
                  {activity.action}
                  <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
                </Link>
              </div>
            </motion.article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default HomePage;
