import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
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
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmCreate, setConfirmCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({ name: '', courtPrice: '', type: 'INDOOR', surface: 'GLASS' });

  const refreshCourts = async () => {
    const result = await courtService.getCourts(0, PAGE_SIZE);
    setCourts(result.content);
    setTotalCourts(result.totalElements);
    setPage(result.number);
    setHasMore(!result.last && result.content.length === PAGE_SIZE);
  };

  const handleCreate = async () => {
    setCreating(true);
    setCreateError(null);
    try {
      await courtService.createCourt({
        name: createForm.name.trim(),
        courtPrice: Number(createForm.courtPrice),
        type: createForm.type,
        surface: createForm.surface,
      });
      await refreshCourts();
      setCreateOpen(false);
      setConfirmCreate(false);
      setCreateForm({ name: '', courtPrice: '', type: 'INDOOR', surface: 'GLASS' });
      setSuccessMessage('Pista creada correctamente.');
    } catch {
      setCreateError('No se ha podido crear la pista.');
    } finally {
      setCreating(false);
    }
  };

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
        {isAdmin && (
          <Button variant="contained" color="error" startIcon={<AddRoundedIcon />} onClick={() => setCreateOpen(true)} sx={{ fontWeight: 800, textTransform: 'none', borderRadius: 2 }}>
            Nueva pista
          </Button>
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
                        disabled={!court.isAvailable && !isAdmin}
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

      <Dialog open={createOpen} onClose={() => !creating && setCreateOpen(false)} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { bgcolor: 'white', borderRadius: 3 } } }}>
        <DialogTitle sx={{ color: 'grey.900', fontWeight: 900 }}>Añadir nueva pista</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Nombre" value={createForm.name} onChange={(event) => setCreateForm((current) => ({ ...current, name: event.target.value }))} fullWidth />
            <TextField label="Precio por hora" type="number" value={createForm.courtPrice} onChange={(event) => setCreateForm((current) => ({ ...current, courtPrice: event.target.value }))} slotProps={{ htmlInput: { min: 0, step: 0.01 } }} fullWidth />
            <TextField select label="Tipo" value={createForm.type} onChange={(event) => setCreateForm((current) => ({ ...current, type: event.target.value }))} fullWidth>
              <MenuItem value="INDOOR">INDOOR</MenuItem>
              <MenuItem value="OUTDOOR">OUTDOOR</MenuItem>
            </TextField>
            <TextField select label="Superficie" value={createForm.surface} onChange={(event) => setCreateForm((current) => ({ ...current, surface: event.target.value }))} fullWidth>
              <MenuItem value="GLASS">GLASS</MenuItem>
              <MenuItem value="WALL">WALL</MenuItem>
            </TextField>
            {createError && <Alert severity="error">{createError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCreateOpen(false)} sx={{ color: 'grey.700', textTransform: 'none' }}>Cancelar</Button>
          <Button variant="contained" color="error" disabled={!createForm.name.trim() || createForm.courtPrice === '' || Number(createForm.courtPrice) < 0} onClick={() => setConfirmCreate(true)} sx={{ textTransform: 'none', fontWeight: 800 }}>Continuar</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={confirmCreate} onClose={() => !creating && setConfirmCreate(false)} fullWidth maxWidth="xs" slotProps={{ paper: { sx: { bgcolor: 'white', borderRadius: 3 } } }}>
        <DialogTitle sx={{ color: 'grey.900', fontWeight: 900 }}>¿Crear esta pista?</DialogTitle>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConfirmCreate(false)} sx={{ color: 'grey.700', textTransform: 'none' }}>Volver</Button>
          <Button variant="contained" color="error" disabled={creating} onClick={() => void handleCreate()} sx={{ textTransform: 'none', fontWeight: 800 }}>{creating ? 'Creando...' : 'Confirmar'}</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={successMessage !== null} autoHideDuration={4000} onClose={() => setSuccessMessage(null)}>
        <Alert severity="success" variant="filled" onClose={() => setSuccessMessage(null)}>{successMessage}</Alert>
      </Snackbar>
    </Box>
  );
}

export default CourtListPage;
