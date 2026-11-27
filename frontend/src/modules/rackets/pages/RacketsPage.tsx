import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  InputAdornment,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { racketService, type RacketListDTO } from '../services/racketService';

const PAGE_SIZE = 10;

function RacketImage({ racket }: Readonly<{ racket: RacketListDTO }>) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
        <Box sx={{ display: 'grid', height: 176, placeItems: 'center', bgcolor: '#f0f1f4' }}>
          <Box
              component="span"
              sx={{
                borderRadius: 3,
                bgcolor: 'white',
                px: 2.5,
                py: 1.5,
                fontSize: 12,
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                color: '#17191e',
                boxShadow: '0 2px 8px rgba(17, 19, 24, 0.06)',
              }}
          >
            {racket.brand}
          </Box>
        </Box>
    );
  }

  return (
      <Box sx={{ position: 'relative', height: 176, overflow: 'hidden', bgcolor: 'white' }}>
        <Box
            component="img"
            src={`/api/v1/rackets/${racket.id}/image`}
            alt={`${racket.brand} ${racket.name}`}
            loading="lazy"
            onError={() => setFailed(true)}
            sx={{ width: '100%', height: '100%', objectFit: 'contain', p: 1.5 }}
        />
      </Box>
  );
}

function RacketsPage() {
  const { isAuthenticated, user } = useAuth();
  const isAdmin = user?.role.toUpperCase().replace(/^ROLE_/, '') === 'ADMIN';
  const [rackets, setRackets] = useState<RacketListDTO[]>([]);
  const [totalModels, setTotalModels] = useState(0);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmCreate, setConfirmCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    brand: '',
    name: '',
    description: '',
    stock: '',
    price: '',
    image: null as File | null,
  });

  const refreshRackets = async () => {
    const result = await racketService.getRackets(0, PAGE_SIZE);
    setRackets(result.content);
    setTotalModels(result.totalElements);
    setPage(result.number);
    setHasMore(!result.last && result.content.length === PAGE_SIZE);
  };

  const handleCreate = async () => {
    setCreating(true);
    setCreateError(null);
    try {
      const created = await racketService.createRacket({
        brand: createForm.brand.trim(),
        name: createForm.name.trim(),
        description: createForm.description.trim(),
        pricePerDay: Number(createForm.price),
        stock: Number(createForm.stock),
      });
      if (createForm.image) {
        await racketService.uploadRacketImage(created.id, createForm.image);
      }
      await refreshRackets();
      setCreateOpen(false);
      setConfirmCreate(false);
      setCreateForm({ brand: '', name: '', description: '', stock: '', price: '', image: null });
      setSuccessMessage('Pala creada correctamente.');
    } catch {
      setCreateError('No se ha podido crear la pala.');
    } finally {
      setCreating(false);
    }
  };

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
            setIsLoading(false);
          }
        });

    return () => controller.abort();
  }, []);

  const retryInitialLoad = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await racketService.getRackets(0, PAGE_SIZE);
      setRackets(result.content);
      setTotalModels(result.totalElements);
      setPage(result.number);
      setHasMore(!result.last && result.content.length === PAGE_SIZE);
    } catch {
      setError('No se ha podido conectar con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = async () => {
    setIsLoadingMore(true);
    setError(null);
    try {
      const result = await racketService.getRackets(page + 1, PAGE_SIZE);
      setRackets((current) => [...current, ...result.content]);
      setTotalModels(result.totalElements);
      setPage(result.number);
      setHasMore(!result.last && result.content.length === PAGE_SIZE);
    } catch {
      setError('No se han podido cargar más palas. Inténtalo de nuevo.');
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
      <Box component="section" sx={{ maxWidth: 1280, mx: 'auto', px: { xs: 2, sm: 3, lg: 4 }, py: { xs: 4, sm: 6 } }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'end' }, gap: 2, mb: 4 }}>
          <Box>
            <Button
                component={Link}
                to="/"
                color="inherit"
                sx={{ mb: 1.5, px: 0, minWidth: 0, color: '#cbd5e1', fontSize: 14, fontWeight: 600, textTransform: 'none', '&:hover': { color: 'white', bgcolor: 'transparent' } }}
            >
              ← Volver al inicio
            </Button>
            <Typography component="p" sx={{ color: '#e60012', fontSize: 12, fontWeight: 700, lineHeight: '16px', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              Encuentra tu pala
            </Typography>
            <Typography component="h1" sx={{ mt: 1, color: 'white', fontSize: { xs: '30px', sm: '36px' }, lineHeight: { xs: '36px', sm: '40px' }, fontWeight: 900, letterSpacing: '-0.025em', fontFamily: 'inherit' }}>
              Catálogo de Palas
            </Typography>
            <Typography component="p" sx={{ mt: 1, color: '#94a3b8', fontSize: 14, lineHeight: '20px' }}>
              Explora el material disponible para tu próximo partido o entrenamiento.
            </Typography>
          </Box>
          {!isLoading && !error && (
              <Box component="span" sx={{ width: 'fit-content', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 99, bgcolor: 'rgba(255,255,255,0.08)', px: 2, py: 1, color: '#e2e8f0', fontSize: 14, fontWeight: 700, boxShadow: 1, backdropFilter: 'blur(8px)' }}>
                {totalModels} {totalModels === 1 ? 'modelo' : 'modelos'}
              </Box>
          )}
          {isAdmin && (
              <Button
                  variant="contained"
                  startIcon={<AddRoundedIcon />}
                  onClick={() => setCreateOpen(true)}
                  sx={{
                    bgcolor: '#e60012',
                    boxShadow: '0 8px 20px rgba(230,0,18,.22)',
                    '&:hover': { bgcolor: '#c4000f' },
                    fontWeight: 800,
                    textTransform: 'none',
                    borderRadius: 3,
                    px: 2.5,
                  }}
              >
                Nueva pala
              </Button>
          )}
        </Box>

        {isLoading && (
            <Box role="status" aria-label="Cargando palas" sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
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
                        onClick={() => void (rackets.length === 0 ? retryInitialLoad() : loadMore())}
                    >
                      Reintentar
                    </Button>
                )}
            >
              {error}
            </Alert>
        )}

        {!isLoading && !error && rackets.length === 0 && (
            <Alert severity="info" sx={{ borderRadius: 2 }}>Todavía no hay palas disponibles.</Alert>
        )}

        {rackets.length > 0 && (
            <Grid container spacing={2.5}>
              {rackets.map((racket) => (
                  <Grid key={racket.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                    <Card
                        elevation={0}
                        sx={{
                          height: '100%',
                          overflow: 'hidden',
                          border: '1px solid #e8e8eb',
                          borderRadius: 4,
                          bgcolor: 'white',
                          boxShadow: '0 12px 32px rgba(17, 19, 24, 0.08)',
                          transition: 'transform 300ms ease, box-shadow 300ms ease',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 16px 36px rgba(17, 19, 24, 0.14)',
                          },
                        }}
                    >
                      <RacketImage racket={racket} />
                      <CardContent sx={{ p: 2.5 }}>
                        <Typography component="p" sx={{ color: '#777d89', fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
                          {racket.brand}
                        </Typography>
                        <Typography component="h2" variant="h6" sx={{ mt: 0.5, color: '#17191e', fontSize: 20, lineHeight: 1.35, fontWeight: 900 }}>
                          {racket.brand} - {racket.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mt: 2.5, borderTop: '1px solid #e8e8eb', pt: 2 }}>
                          <Typography variant="body2" sx={{ color: '#777d89' }}>
                            Disponibilidad
                            <Box component="span" sx={{ display: 'block', mt: 0.5, color: racket.stock && racket.stock > 0 ? '#059669' : '#e60012', fontWeight: 800 }}>
                              {racket.stock && racket.stock > 0
                                  ? `${racket.stock} ${racket.stock === 1 ? 'pala disponible' : 'palas disponibles'}`
                                  : 'Agotada'}
                            </Box>
                          </Typography>
                          {isAuthenticated ? (
                              <Button
                                  component={Link}
                                  to={`/rackets/${racket.id}`}
                                  aria-label={`Ver detalles de ${racket.brand} ${racket.name}`}
                                  variant="contained"
                                  sx={{
                                    minHeight: 40,
                                    borderRadius: 3,
                                    px: 2,
                                    bgcolor: '#e60012',
                                    fontWeight: 800,
                                    fontSize: 12,
                                    textTransform: 'none',
                                    whiteSpace: 'nowrap',
                                    boxShadow: 'none',
                                    '&:hover': { bgcolor: '#c4000f', boxShadow: 'none' },
                                  }}
                              >
                                Ver detalles
                              </Button>
                          ) : (
                              <Button
                                  component={Link}
                                  to="/login"
                                  variant="contained"
                                  sx={{
                                    minHeight: 40,
                                    borderRadius: 3,
                                    px: 2,
                                    bgcolor: '#e60012',
                                    color: 'white',
                                    fontWeight: 800,
                                    fontSize: 12,
                                    textTransform: 'none',
                                    whiteSpace: 'nowrap',
                                    boxShadow: 'none',
                                    '&:hover': { bgcolor: '#c4000f', boxShadow: 'none' },
                                  }}
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
                    borderRadius: 3,
                    fontWeight: 700,
                    textTransform: 'none',
                    '&:hover': { bgcolor: 'grey.100', borderColor: 'grey.100' },
                  }}
              >
                Más resultados
              </Button>
            </Box>
        )}

        <Dialog
            open={createOpen}
            onClose={() => !creating && setCreateOpen(false)}
            fullWidth
            maxWidth="sm"
            slotProps={{
              paper: {
                sx: { borderRadius: 4, p: 0.5, m: { xs: 2, sm: 4 } },
              },
            }}
        >
          <DialogTitle sx={{ px: { xs: 2.5, sm: 3 }, pt: 2.5, pb: 1, fontWeight: 900 }}>
            Añadir nueva pala
          </DialogTitle>
          <DialogContent sx={{ px: { xs: 2.5, sm: 3 }, pb: 1.5 }}>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField label="Marca" value={createForm.brand} onChange={(event) => setCreateForm((current) => ({ ...current, brand: event.target.value }))} fullWidth />
              <TextField label="Nombre" value={createForm.name} onChange={(event) => setCreateForm((current) => ({ ...current, name: event.target.value }))} fullWidth />
              <TextField label="Descripción" value={createForm.description} onChange={(event) => setCreateForm((current) => ({ ...current, description: event.target.value }))} multiline minRows={3} fullWidth />
              <TextField
                  label="Precio para 3 sesiones"
                  type="number"
                  value={createForm.price}
                  onChange={(event) => setCreateForm((current) => ({ ...current, price: event.target.value }))}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start">€</InputAdornment> }, htmlInput: { min: 0, step: 0.01 } }}
                  fullWidth
              />
              <TextField
                  label="Stock inicial"
                  type="number"
                  value={createForm.stock}
                  onChange={(event) => setCreateForm((current) => ({ ...current, stock: event.target.value }))}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start">uds.</InputAdornment> }, htmlInput: { min: 0, step: 1 } }}
                  fullWidth
              />
              <Button
                  component="label"
                  variant="outlined"
                  color="inherit"
                  sx={{
                    justifyContent: 'flex-start',
                    textTransform: 'none',
                    borderRadius: 3,
                    borderColor: 'grey.300',
                    color: 'grey.800',
                    fontWeight: 700,
                    py: 1.1,
                  }}
              >
                {createForm.image?.name ?? 'Seleccionar imagen (opcional)'}
                <input hidden type="file" accept="image/*" onChange={(event) => setCreateForm((current) => ({ ...current, image: event.target.files?.[0] ?? null }))} />
              </Button>
              {createError && <Alert severity="error" sx={{ borderRadius: 3 }}>{createError}</Alert>}
            </Stack>
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
            <Button
                onClick={() => setCreateOpen(false)}
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
            </Button>
            <Button
                variant="contained"
                disabled={
                    !createForm.brand.trim()
                    || !createForm.name.trim()
                    || !createForm.description.trim()
                    || createForm.stock === ''
                    || Number(createForm.stock) < 0
                    || createForm.price === ''
                    || Number(createForm.price) < 0
                }
                onClick={() => setConfirmCreate(true)}
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
              Continuar
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
            open={confirmCreate}
            onClose={() => !creating && setConfirmCreate(false)}
            fullWidth
            maxWidth="xs"
            slotProps={{
              paper: {
                sx: { borderRadius: 4, p: 0.5, m: { xs: 2, sm: 4 } },
              },
            }}
        >
          <DialogTitle sx={{ px: { xs: 2.5, sm: 3 }, pt: 2.5, pb: 1, fontWeight: 900 }}>
            ¿Crear esta pala?
          </DialogTitle>
          <DialogActions
              sx={{
                px: { xs: 2.5, sm: 3 },
                pb: 2.5,
                pt: 1.5,
                gap: 1.25,
                flexDirection: { xs: 'column-reverse', sm: 'row' },
                '& > :not(style) ~ :not(style)': { ml: { xs: 0, sm: 1.25 } },
              }}
          >
            <Button
                onClick={() => setConfirmCreate(false)}
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
              Volver
            </Button>
            <Button
                variant="contained"
                disabled={creating}
                onClick={() => void handleCreate()}
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
              {creating ? 'Creando...' : 'Confirmar'}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={successMessage !== null} autoHideDuration={4000} onClose={() => setSuccessMessage(null)}>
          <Alert severity="success" variant="filled" onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        </Snackbar>
      </Box>
  );
}

export default RacketsPage;