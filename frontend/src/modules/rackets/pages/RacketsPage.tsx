import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, CircularProgress } from '@mui/material';
import { useAuth } from '../../auth/hooks/useAuth';
import { racketService, type RacketListDTO } from '../services/racketService';

const PAGE_SIZE = 10;

function RacketSkeleton() {
  return (
    <div aria-hidden="true" className="overflow-hidden rounded-3xl border border-brand-line bg-white shadow-sm">
      <div className="h-44 animate-pulse bg-slate-200" />
      <div className="space-y-4 p-5">
        <div className="h-3 w-1/4 animate-pulse rounded bg-slate-200" />
        <div className="h-5 w-2/3 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
        <div className="h-10 w-full animate-pulse rounded-xl bg-slate-100" />
      </div>
    </div>
  );
}

function RacketImage({ racket }: { racket: RacketListDTO }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="grid h-44 place-items-center bg-gradient-to-br from-slate-100 to-slate-200">
        <span className="rounded-2xl bg-white/80 px-5 py-3 text-xs font-black uppercase tracking-[0.25em] text-brand-ink shadow-sm">
          {racket.brand}
        </span>
      </div>
    );
  }

  return (
    <div className="relative h-44 overflow-hidden bg-white">
      <img
        src={`/api/v1/rackets/${racket.id}/image`}
        alt={`${racket.brand} ${racket.name}`}
        loading="lazy"
        onError={() => setFailed(true)}
        className="h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-105"
      />
    </div>
  );
}

function RacketsPage() {
  const { isAuthenticated } = useAuth();
  const [rackets, setRackets] = useState<RacketListDTO[]>([]);
  const [totalModels, setTotalModels] = useState(0);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moreError, setMoreError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void racketService.getRackets(0, PAGE_SIZE, controller.signal)
      .then((result) => {
        setRackets(result.content);
        setTotalModels(result.totalElements);
        setPage(result.number);
        setHasMore(!result.last && result.content.length === PAGE_SIZE);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setError('No se ha podido conectar con el servidor.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, []);

  const loadMore = async () => {
    setLoadingMore(true);
    setMoreError(null);
    try {
      const nextPage = page + 1;
      const result = await racketService.getRackets(nextPage, PAGE_SIZE);
      setRackets((current) => [...current, ...result.content]);
      setPage(result.number);
      setHasMore(!result.last && result.content.length === PAGE_SIZE);
    } catch {
      setMoreError('No se han podido cargar más palas.');
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link to="/" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-white">
            <span aria-hidden="true">←</span> Volver al inicio
          </Link>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-red">Encuentra tu pala</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">Catálogo de Palas</h1>
          <p className="mt-2 text-sm text-slate-400">Explora el material disponible para tu próximo partido o entrenamiento.</p>
        </div>
        {!loading && !error && (
          <span className="w-fit rounded-full border border-white/10 bg-white/[0.08] px-4 py-2 text-sm font-semibold text-slate-200 shadow-sm backdrop-blur">
            {totalModels} {totalModels === 1 ? 'modelo' : 'modelos'}
          </span>
        )}
      </div>

      {loading && (
        <div role="status" aria-label="Cargando palas" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <span className="sr-only">Cargando palas de la base de datos...</span>
          {Array.from({ length: 6 }, (_, index) => <RacketSkeleton key={index} />)}
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
          <p className="font-semibold text-brand-ink"><strong>Error:</strong> {error}</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setError(null);
              void racketService.getRackets(0, PAGE_SIZE)
                .then((result) => {
                  setRackets(result.content);
                  setTotalModels(result.totalElements);
                  setPage(result.number);
                  setHasMore(!result.last && result.content.length === PAGE_SIZE);
                })
                .catch(() => setError('No se ha podido conectar con el servidor.'))
                .finally(() => setLoading(false));
            }}
            className="mt-5 rounded-xl bg-brand-red px-5 py-3 text-sm font-bold text-white shadow-red transition hover:-translate-y-0.5 hover:bg-red-600 active:scale-95"
          >
            Volver a intentarlo
          </button>
        </div>
      )}

      {!loading && !error && rackets.length === 0 && (
        <div className="rounded-3xl border border-brand-line bg-white p-10 text-center shadow-sm">
          <p className="font-semibold text-brand-ink">Todavía no hay palas disponibles.</p>
        </div>
      )}

      {!loading && !error && rackets.length > 0 && (
        <ul className="grid list-none gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {rackets.map((racket) => (
            <li key={racket.id} className="group overflow-hidden rounded-3xl border border-brand-line bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-soft">
              <RacketImage racket={racket} />
              <div className="p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-muted">{racket.brand}</p>
                <h2 className="mt-1 text-xl font-black text-brand-ink">{racket.brand} - {racket.name}</h2>
                <div className="mt-5 flex items-center justify-between border-t border-brand-line pt-4">
                  <p className="text-sm text-brand-muted">
                    Disponibilidad
                    <span className={`mt-1 block font-bold ${racket.stock && racket.stock > 0 ? 'text-emerald-600' : 'text-brand-red'}`}>
                      {racket.stock && racket.stock > 0
                        ? `${racket.stock} ${racket.stock === 1 ? 'pala disponible' : 'palas disponibles'}`
                        : 'Agotada'}
                    </span>
                  </p>
                  {isAuthenticated ? (
                    <Link
                      to={`/rackets/${racket.id}`}
                      aria-label={`Ver detalles de ${racket.brand} ${racket.name}`}
                      className="rounded-xl bg-brand-red px-4 py-2.5 text-xs font-bold text-white transition hover:bg-red-600"
                    >
                      Ver detalles
                    </Link>
                  ) : (
                    <Link
                      to="/login"
                      className="rounded-xl bg-brand-red px-4 py-2.5 text-center text-xs font-bold text-white transition hover:bg-red-600"
                    >
                      Inicia sesión para reservar
                    </Link>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!loading && !error && rackets.length > 0 && hasMore && (
        <div className="mt-8 flex flex-col items-center gap-3">
          {moreError && <p role="alert" className="text-sm font-semibold text-red-300">{moreError}</p>}
          <Button
            variant="outlined"
            onClick={() => void loadMore()}
            disabled={loadingMore}
            startIcon={loadingMore ? <CircularProgress size={18} color="inherit" /> : undefined}
            sx={{
              borderColor: 'rgba(255,255,255,0.35)',
              color: 'white',
              '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.08)' },
            }}
          >
            Más resultados
          </Button>
        </div>
      )}
    </section>
  );
}

export default RacketsPage;
