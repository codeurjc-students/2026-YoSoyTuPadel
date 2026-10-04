import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  Grid,
  Typography,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { courtService, type PreCourtDTO } from '../services/courtService';

const PAGE_SIZE = 10;
const courtImage = '/images/padel-court-overhead.jpg';

function CourtListPage() {
  const { isAuthenticated, user } = useAuth();
  const isAdmin = user?.role.toUpperCase().replace(/^ROLE_/, '') === 'ADMIN';
  const [courts, setCourts] = useState<PreCourtDTO[]>([]);
  const [totalCourts, setTotalCourts] = useState(0);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void courtService.getCourts(0, PAGE_SIZE, controller.signal)
      .then((result) => {
        setCourts(result.content);
        setTotalCourts(result.totalElements);
        setPage(result.number);
        setHasMore(!result.last && result.content.length === PAGE_SIZE);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError('No se han podido cargar las pistas.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, []);

  const retryInitialLoad = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await courtService.getCourts(0, PAGE_SIZE);
      setCourts(result.content);
      setTotalCourts(result.totalElements);
      setPage(result.number);
      setHasMore(!result.last && result.content.length === PAGE_SIZE);
    } catch {
      setError('No se han podido cargar las pistas.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = async () => {
    setIsLoadingMore(true);
    setError(null);
    try {
      const result = await courtService.getCourts(page + 1, PAGE_SIZE);
      setCourts((current) => [...current, ...result.content]);
      setTotalCourts(result.totalElements);
      setPage(result.number);
      setHasMore(!result.last && result.content.length === PAGE_SIZE);
    } catch {
      setError('No se han podido cargar más pistas. Inténtalo de nuevo.');
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <Box component="section" sx={{ maxWidth: 1280, mx: 'auto', px: { xs: 2, sm: 3, lg: 4 }, py: { xs: 4, sm: 6 } }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'end' }, gap: 2, mb: 4 }}>
        <Box>
          <Link to="/" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-white">
            <span aria-hidden="true">←</span> Volver al inicio
          </Link>
          <Typography component="p" sx={{ color: '#e60012', fontSize: 12, fontWeight: 700, lineHeight: '16px', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            Encuentra tu pista
          </Typography>
          <Typography component="h1" sx={{ mt: 1, color: 'white', fontSize: { xs: '30px', sm: '36px' }, lineHeight: { xs: '36px', sm: '40px' }, fontWeight: 900, letterSpacing: '-0.025em', fontFamily: 'inherit' }}>
            Catálogo de Pistas
          </Typography>
          <Typography component="p" sx={{ mt: 1, color: '#94a3b8', fontSize: 14, lineHeight: '20px' }}>
            Explora las pistas disponibles para tu próximo partido.
          </Typography>
        </Box>
        {!isLoading && !error && (
          <Box component="span" sx={{ width: 'fit-content', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 99, bgcolor: 'rgba(255,255,255,0.08)', px: 2, py: 1, color: '#e2e8f0', fontSize: 14, fontWeight: 700, boxShadow: 1, backdropFilter: 'blur(8px)' }}>
            {totalCourts} {totalCourts === 1 ? 'pista' : 'pistas'}
          </Box>
        )}
      </Box>

      {isLoading && (
        <Box role="status" aria-label="Cargando pistas" sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress color="error" />
        </Box>
      )}

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3, borderRadius: 2 }}
          action={isLoadingMore ? <CircularProgress size={18} /> : (
            <Button
              color="inherit"
              size="small"
              onClick={() => void (courts.length === 0 ? retryInitialLoad() : loadMore())}
            >
              Reintentar
            </Button>
          )}
        >
          {error}
        </Alert>
      )}

      {!isLoading && !error && courts.length === 0 && (
        <Alert severity="info" sx={{ borderRadius: 2 }}>No hay pistas disponibles en estos momentos.</Alert>
      )}

      {courts.length > 0 && (
        <Grid container spacing={2.5}>
          {courts.map((court) => {
            return (
              <Grid key={court.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    overflow: 'hidden',
                    border: '1px solid #e8e8eb',
                    borderRadius: '24px',
                    bgcolor: 'white',
                    boxShadow: '0 1px 2px rgba(16,24,40,0.08)',
                    transition: 'transform 300ms ease, box-shadow 300ms ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 28px rgba(16,24,40,0.14)',
                    },
                  }}
                >
                  <Box sx={{ position: 'relative', height: 176, overflow: 'hidden', bgcolor: 'white' }}>
                    <CardMedia
                      component="img"
                      image={courtImage}
                      alt={`Vista de una pista de pádel - ${court.name}`}
                      sx={{ height: '100%', objectFit: 'cover' }}
                    />
                    {!court.isAvailable && (
                      <Box sx={{ position: 'absolute', top: 2, left: 2, borderRadius: 99, bgcolor: 'white', px: 1.25, py: 0.5, color: '#c62828', fontSize: 12, fontWeight: 800 }}>
                        No disponible
                      </Box>
                    )}
                  </Box>
                  <CardContent sx={{ p: 2.5 }}>
                    <Typography component="h2" variant="h6" sx={{ color: '#17191e', fontSize: 20, lineHeight: 1.35, fontWeight: 900 }}>
                      {court.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mt: 2.5, borderTop: '1px solid #e8e8eb', pt: 2 }}>
                      <Typography variant="body2" sx={{ color: '#777d89' }}>
                        Disponibilidad
                        <Box component="span" sx={{ display: 'block', mt: 0.5, color: court.isAvailable ? '#059669' : '#e60012', fontWeight: 800 }}>
                          {court.isAvailable ? 'Disponible' : 'No disponible'}
                        </Box>
                      </Typography>
                    {isAuthenticated ? (
                      <Button
                        component={Link}
                        to={`/courts/${court.id}`}
                        variant="contained"
                        disabled={!court.isAvailable}
                        color="error"
                        sx={{ minHeight: 40, borderRadius: 2, px: 2, bgcolor: '#e60012', fontWeight: 800, fontSize: 12, textTransform: 'none', whiteSpace: 'nowrap', boxShadow: 'none', '&:hover': { bgcolor: '#c90010', boxShadow: 'none' } }}
                      >
                        {isAdmin ? 'Ver detalles' : 'Ver disponibilidad'}
                      </Button>
                    ) : (
                      <Button
                        component={Link}
                        to="/login"
                        variant="contained"
                        color="error"
                        sx={{ minHeight: 40, borderRadius: 2, px: 2, bgcolor: '#e60012', color: 'white', fontWeight: 800, fontSize: 12, textTransform: 'none', whiteSpace: 'nowrap', boxShadow: 'none', '&:hover': { bgcolor: '#c90010', boxShadow: 'none' } }}
                      >
                        Inicia sesión para reservar
                      </Button>
                    )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {!isLoading && hasMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button
            variant="outlined"
            onClick={() => void loadMore()}
            disabled={isLoadingMore}
            startIcon={isLoadingMore ? <CircularProgress size={18} color="inherit" /> : undefined}
            sx={{
              px: 3,
              minHeight: 44,
              bgcolor: 'white',
              color: '#111318',
              borderColor: 'white',
              borderRadius: 2,
              fontWeight: 700,
              textTransform: 'none',
              '&:hover': { bgcolor: 'grey.100', borderColor: 'grey.100' },
            }}
          >
            Más resultados
          </Button>
        </Box>
      )}
    </Box>
  );
}

export default CourtListPage;
