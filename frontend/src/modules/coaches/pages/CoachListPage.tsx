import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Grid,
  Typography,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { coachService, type PreCoachDTO } from '../services/coachService';

const PAGE_SIZE = 10;
const coachImage = '/images/coach-training.jpg';

function CoachListPage() {
  const { isAuthenticated } = useAuth();
  const [coaches, setCoaches] = useState<PreCoachDTO[]>([]);
  const [totalCoaches, setTotalCoaches] = useState(0);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void coachService.getCoaches(0, PAGE_SIZE, controller.signal)
      .then((result) => {
        setCoaches(result.content);
        setTotalCoaches(result.totalElements);
        setPage(result.number);
        setHasMore(!result.last && result.content.length === PAGE_SIZE);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError('No se han podido cargar los entrenadores.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, []);

  const loadMore = async () => {
    setIsLoadingMore(true);
    setError(null);
    try {
      const result = await coachService.getCoaches(page + 1, PAGE_SIZE);
      setCoaches((current) => [...current, ...result.content]);
      setTotalCoaches(result.totalElements);
      setPage(result.number);
      setHasMore(!result.last && result.content.length === PAGE_SIZE);
    } catch {
      setError('No se han podido cargar más entrenadores. Inténtalo de nuevo.');
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
            Mejora tu juego
          </Typography>
          <Typography component="h1" sx={{ mt: 1, color: 'white', fontSize: { xs: '30px', sm: '36px' }, lineHeight: { xs: '36px', sm: '40px' }, fontWeight: 900, letterSpacing: '-0.025em' }}>
            Nuestros Entrenadores
          </Typography>
          <Typography component="p" sx={{ mt: 1, color: '#94a3b8', fontSize: 14, lineHeight: '20px' }}>
            Encuentra un profesional que te ayude a llevar tu juego al siguiente nivel.
          </Typography>
        </Box>
        {!isLoading && !error && (
          <Box component="span" sx={{ width: 'fit-content', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 99, bgcolor: 'rgba(255,255,255,0.08)', px: 2, py: 1, color: '#e2e8f0', fontSize: 14, fontWeight: 700, boxShadow: 1, backdropFilter: 'blur(8px)' }}>
            {totalCoaches} {totalCoaches === 1 ? 'entrenador disponible' : 'entrenadores disponibles'}
          </Box>
        )}
      </Box>

      {isLoading && (
        <Box role="status" aria-label="Cargando entrenadores" sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress color="error" />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {!isLoading && !error && coaches.length === 0 && (
        <Alert severity="info" sx={{ borderRadius: 2 }}>No hay entrenadores disponibles en estos momentos.</Alert>
      )}

      {!isLoading && !error && coaches.length > 0 && (
        <Box sx={{ mb: 3, p: { xs: 2.5, sm: 3 }, border: '1px solid #fff', borderRadius: 2, bgcolor: 'white', boxShadow: '0 0 16px rgba(255,255,255,0.12)', display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 2 }}>
          <Box>
            <Typography component="h2" sx={{ color: '#111318', fontSize: { xs: 18, sm: 20 }, fontWeight: 900, letterSpacing: '0.04em' }}>
              CERTIFICADOS POR LA FEP
            </Typography>
            <Typography sx={{ mt: 0.75, color: '#333844', fontSize: 14, lineHeight: 1.6 }}>
              Todos nuestros entrenadores cuentan con certificación oficial de la Federación Española de Pádel
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'flex-start', sm: 'flex-end' }, flexWrap: 'wrap', gap: 0.75, flexShrink: 0 }}>
            {[1, 2, 3].map((level) => (
              <Chip
                key={level}
                label={`Nivel ${level}`}
                size="small"
                sx={{ bgcolor: '#e60012', color: 'white', fontSize: 12, fontWeight: 800, '& .MuiChip-label': { px: 1.25 } }}
              />
            ))}
          </Box>
        </Box>
      )}

      {!isLoading && coaches.length > 0 && (
        <Grid container spacing={2.5}>
          {coaches.map((coach) => (
            <Grid key={coach.id} size={{ xs: 12, sm: 6, lg: 4 }}>
              <Card
                elevation={2}
                sx={{
                  height: '100%',
                  overflow: 'hidden',
                  border: '1px solid #e8e8eb',
                  borderRadius: '24px',
                  bgcolor: 'white',
                  boxShadow: '0 1px 2px rgba(16,24,40,0.08)',
                  transition: 'transform 300ms ease, box-shadow 300ms ease',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 28px rgba(16,24,40,0.14)' },
                }}
              >
                <CardMedia
                  component="img"
                  image={coachService.getCoachImageUrl(coach.id)}
                  alt={`Entrenamiento de pádel con ${coach.name}`}
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = coachImage;
                  }}
                  sx={{ height: 300, objectFit: 'cover', objectPosition: 'top' }}
                />
                <CardContent sx={{ p: 2.5 }}>
                  <Typography component="h2" variant="h6" sx={{ color: '#17191e', fontSize: 20, lineHeight: 1.35, fontWeight: 900 }}>
                    {coach.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mt: 2.5, borderTop: '1px solid #e8e8eb', pt: 2 }}>
                    <Chip
                      icon={<Box component="span" sx={{ display: 'grid', placeItems: 'center', width: 18, height: 18, border: '1px solid currentColor', borderRadius: '50%', fontSize: 11, fontWeight: 900 }}>✓</Box>}
                      label={`FEP Nivel ${coach.skillLevel ?? '—'}`}
                      size="small"
                      sx={{ bgcolor: '#f0f1f4', color: '#333844', fontWeight: 800, flexShrink: 0, '& .MuiChip-icon': { color: '#e60012', ml: 1 } }}
                    />
                    {isAuthenticated ? (
                      <Button
                        component={Link}
                        to={`/coaches/${coach.id}`}
                        variant="contained"
                        color="error"
                        sx={{ minHeight: 40, borderRadius: 2, px: { xs: 1.25, sm: 2 }, bgcolor: '#e60012', fontWeight: 800, fontSize: 12, textTransform: 'none', whiteSpace: 'nowrap', boxShadow: 'none', '&:hover': { bgcolor: '#c90010', boxShadow: 'none' } }}
                      >
                        Ver detalles
                      </Button>
                    ) : (
                      <Button
                        component={Link}
                        to="/login"
                        variant="contained"
                        color="error"
                        sx={{ minHeight: 40, borderRadius: 2, px: { xs: 1.25, sm: 2 }, bgcolor: '#e60012', color: 'white', fontWeight: 800, fontSize: 12, textTransform: 'none', whiteSpace: 'nowrap', boxShadow: 'none', '&:hover': { bgcolor: '#c90010', boxShadow: 'none' } }}
                      >
                        Inicia sesión para reservar
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {!isLoading && !error && coaches.length > 0 && hasMore && (
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
              color: 'primary.main',
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

export default CoachListPage;
