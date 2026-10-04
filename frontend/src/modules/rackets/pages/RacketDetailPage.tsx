import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { racketService, type RacketDTO } from '../services/racketService';

interface RacketDetails extends RacketDTO {
  image: string;
}

type Feedback = {
  severity: 'success' | 'error';
  message: string;
};

function RacketDetailPage() {
  const { isAuthenticated, user } = useAuth();
  const isAdmin = user?.role.toUpperCase().replace(/^ROLE_/, '') === 'ADMIN';
  const { id: idParam } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const id = Number(idParam);
  const validId = Number.isInteger(id) && id > 0;
  const [racket, setRacket] = useState<RacketDetails | null>(null);
  const [loadedRouteId, setLoadedRouteId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [editForm, setEditForm] = useState<RacketDTO | null>(null);
  const isLoading = loadedRouteId !== (idParam ?? '');
  const hasRacketChanges = Boolean(editForm && racket && (
    editForm.brand !== racket.brand
    || editForm.name !== racket.name
    || editForm.description !== racket.description
    || editForm.pricePerDay !== racket.pricePerDay
    || editForm.stock !== racket.stock
  ));

  const redirectToProfileForExistingRental = () => {
    setDialogOpen(false);
    toast('Ya tienes una pala alquilada. Consulta los usos restantes en tus reservas.', {
      icon: '🎾',
      style: { fontSize: '1.1rem', lineHeight: 1.5, padding: '18px 24px', maxWidth: 440 },
    });
    navigate('/bookings?tab=material');
  };

  useEffect(() => {
    if (!validId) {
      const timer = window.setTimeout(() => {
        setRacket(null);
        setLoadError(false);
        setLoadedRouteId(idParam ?? '');
      }, 0);
      return () => window.clearTimeout(timer);
    }

    const controller = new AbortController();
    void racketService.getRacketById(id, controller.signal)
      .then((racketDto) => {
        if (!controller.signal.aborted) {
          setRacket({
            ...racketDto,
            image: `/api/v1/rackets/${racketDto.id}/image`,
          });
          setLoadError(false);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setRacket(null);
          setLoadError(true);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoadedRouteId(idParam ?? '');
        }
      });

    return () => controller.abort();
  }, [id, idParam, validId]);

  const confirmBooking = async () => {
    if (!user || !racket || isSubmitting) {
      return;
    }
    if (user.racketId != null) {
      redirectToProfileForExistingRental();
      return;
    }

    setIsSubmitting(true);
    try {
      await racketService.rentRacket(user.id, racket.id);
      setRacket((previous) =>
          previous
              ? { ...previous, stock: previous.stock === null ? null : Math.max(0, previous.stock - 1) }
              : null,
      );
      setDialogOpen(false);
      setFeedback({ severity: 'success', message: '¡Pala reservada con éxito!' });
    } catch (error: unknown) {
      const backendMessage = axios.isAxiosError<{ message?: string; error?: string }>(error)
        ? error.response?.data?.message ?? error.response?.data?.error
        : error instanceof Error ? error.message : undefined;

      if (backendMessage?.toLowerCase().includes('already have a rented racket')) {
        redirectToProfileForExistingRental();
      } else {
        setFeedback({ severity: 'error', message: 'No se ha podido reservar la pala. Inténtalo de nuevo.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveRacket = async () => {
    if (!editForm) return;
    try {
      const updated = await racketService.updateRacket(editForm);
      setRacket((previous) => previous
        ? { ...previous, ...updated, image: previous.image }
        : { ...updated, image: `/api/v1/rackets/${updated.id}/image` });
      setEditOpen(false);
      setFeedback({ severity: 'success', message: 'Pala actualizada correctamente.' });
    } catch {
      setFeedback({ severity: 'error', message: 'No se ha podido actualizar la pala.' });
    }
  };

  const deleteRacket = async () => {
    if (!racket) return;
    try {
      await racketService.deleteRacket(racket.id);
      setDeleteOpen(false);
      setFeedback({ severity: 'success', message: 'Pala eliminada con éxito' });
      window.setTimeout(() => navigate('/rackets', { replace: true }), 1500);
    } catch {
      setFeedback({ severity: 'error', message: 'No se ha podido eliminar la pala.' });
    }
  };

  const uploadPhoto = async () => {
    if (!selectedPhoto || !racket) return;
    try {
      await racketService.uploadRacketImage(racket.id, selectedPhoto);
      setRacket((current) => current ? { ...current, image: `/api/v1/rackets/${current.id}/image?v=${Date.now()}` } : current);
      setSelectedPhoto(null);
      setPhotoOpen(false);
      setFeedback({ severity: 'success', message: 'Imagen actualizada correctamente.' });
    } catch {
      setFeedback({ severity: 'error', message: 'No se ha podido actualizar la imagen.' });
    }
  };

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading) {
    return (
      <Box role="status" aria-label="Cargando pala" sx={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress color="error" />
      </Box>
    );
  }

  if (loadError || !racket) {
    return (
      <Stack sx={{ minHeight: '60vh', px: 2, textAlign: 'center', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <Typography component="h1" sx={{ fontSize: 32, fontWeight: 800, color: 'common.white' }}>
          {loadError ? 'No se ha podido cargar la pala' : 'No se ha encontrado la pala'}
        </Typography>
        <Button component={Link} to="/rackets" variant="contained" color="error">Volver al catálogo</Button>
      </Stack>
    );
  }

  return (
    <Box component="main" sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, sm: 3, lg: 4 }, py: { xs: 4, md: 7 } }}>
      <Button component={Link} to="/rackets" color="inherit" sx={{ mb: 3, color: 'grey.300', fontWeight: 700 }}>
        ← Volver al catálogo
      </Button>

      <Grid container component="div" spacing={{ xs: 3, md: 6 }} sx={{ maxWidth: 900, mx: 'auto', alignItems: 'center' }}>
        <Grid component="div" size={{ xs: 12, md: 6 }}>
          <Box
            sx={{
              minHeight: { xs: 320, sm: 420 },
              display: 'grid',
              placeItems: 'center',
              overflow: 'hidden',
              borderRadius: { xs: 4, md: 6 },
              border: '1px solid rgba(255,255,255,.14)',
              bgcolor: 'rgba(255,255,255,.96)',
              boxShadow: '0 24px 70px rgba(0,0,0,.24)',
            }}
          >
            <Box
              component="img"
              src={racket.image}
              alt={`${racket.brand} ${racket.name}`}
              sx={{ display: 'block', width: '100%', height: { xs: 320, sm: 420 }, objectFit: 'contain', p: { xs: 3, sm: 5 } }}
            />
            {isAdmin && (
              <Button
                component="label"
                variant="contained"
                sx={{ mt: 2, bgcolor: 'white', color: 'grey.900', fontWeight: 800, textTransform: 'none', borderRadius: 2, '&:hover': { bgcolor: 'grey.200' } }}
              >
                Actualizar foto
                <input type="file" hidden accept="image/*" onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  event.target.value = '';
                  if (file) {
                    setSelectedPhoto(file);
                    setPhotoOpen(true);
                  }
                }} />
              </Button>
            )}
          </Box>
        </Grid>

        <Grid component="div" size={{ xs: 12, md: 6 }}>
          <Stack spacing={2.5} sx={{ color: 'common.white' }}>
            <Typography component="h1" sx={{ fontSize: { xs: 34, sm: 42, md: 48 }, fontWeight: 900, lineHeight: 1.05, letterSpacing: -1.5 }}>
              {racket.brand} {racket.name}
            </Typography>
            <Typography sx={{ color: 'grey.300', fontSize: { xs: 15, sm: 16 }, lineHeight: 1.85 }}>
              {racket.description}
            </Typography>
            <Box>
              <Typography sx={{ color: 'grey.400', fontSize: 12, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                Precio para 3 sesiones
              </Typography>
              <Typography component="p" sx={{ mt: 0.5, fontSize: 36, fontWeight: 900 }}>
                {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(racket.pricePerDay)}
              </Typography>
            </Box>
            <Typography sx={{ color: 'grey.300', fontWeight: 700 }}>
              Stock disponible: {racket.stock ?? 0}
            </Typography>
            {isAdmin ? null : racket.stock !== null && racket.stock > 0 ? (
              <Button
                fullWidth
                variant="contained"
                color="error"
                size="large"
                onClick={() => {
                  if (user?.racketId != null) {
                    redirectToProfileForExistingRental();
                  } else {
                    setDialogOpen(true);
                  }
                }}
                sx={{ py: 1.8, borderRadius: 3, fontWeight: 900, letterSpacing: 1, boxShadow: '0 12px 28px rgba(230,0,18,.25)' }}
              >
                Reservar
              </Button>
            ) : (
              <Stack spacing={1.5} sx={{ pt: 1 }}>
                <Alert
                  severity="info"
                  sx={{
                    border: '1px solid rgba(230,0,18,.28)',
                    borderRadius: 3,
                    bgcolor: 'rgba(230,0,18,.1)',
                    color: 'grey.100',
                    '& .MuiAlert-icon': { color: 'error.main' },
                  }}
                >
                  En estos momentos no tenemos más raquetas de este modelo.
                </Alert>
                <Button
                  component={Link}
                  to="/rackets"
                  variant="contained"
                  color="error"
                  fullWidth
                  sx={{
                    py: 1.4,
                    borderRadius: 3,
                    color: 'white',
                    bgcolor: '#e60012',
                    fontWeight: 900,
                    letterSpacing: 0.6,
                    '&:hover': { color: 'white', bgcolor: '#c90010' },
                  }}
                >
                  Mirar otras palas
                </Button>
              </Stack>
            )}
          </Stack>
        </Grid>
      </Grid>

        {isAdmin && (
          <Stack direction="row" spacing={2} sx={{ justifyContent: 'center', mt: 3 }}>
            <Button variant="contained" onClick={() => { setEditForm({ ...racket }); setEditOpen(true); }} sx={{ bgcolor: 'white', color: 'grey.900', fontWeight: 800, textTransform: 'none', borderRadius: 2, '&:hover': { bgcolor: 'grey.200' } }}>Editar</Button>
            <Button variant="contained" color="error" onClick={() => setDeleteOpen(true)} sx={{ fontWeight: 800, textTransform: 'none', borderRadius: 2 }}>Eliminar</Button>
          </Stack>
        )}

        <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { bgcolor: 'white', borderRadius: 3, color: 'grey.900' } } }}>
          <DialogTitle sx={{ color: 'grey.900', fontWeight: 900 }}>Editar pala</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField variant="outlined" label="Marca" value={editForm?.brand ?? ''} onChange={(event) => setEditForm((current) => current ? { ...current, brand: event.target.value } : current)} fullWidth />
              <TextField variant="outlined" label="Nombre" value={editForm?.name ?? ''} onChange={(event) => setEditForm((current) => current ? { ...current, name: event.target.value } : current)} fullWidth />
              <TextField variant="outlined" label="Descripción" multiline value={editForm?.description ?? ''} onChange={(event) => setEditForm((current) => current ? { ...current, description: event.target.value } : current)} fullWidth />
              <TextField variant="outlined" label="Precio" type="number" value={editForm?.pricePerDay ?? ''} onChange={(event) => setEditForm((current) => current ? { ...current, pricePerDay: Number(event.target.value) } : current)} fullWidth />
              <TextField variant="outlined" label="Stock" type="number" value={editForm?.stock ?? ''} onChange={(event) => setEditForm((current) => current ? { ...current, stock: Number(event.target.value) } : current)} fullWidth />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditOpen(false)} variant="text" sx={{ color: 'grey.700', textTransform: 'none' }}>Cancelar</Button>
            <Button disabled={!hasRacketChanges} variant="contained" onClick={() => void saveRacket()} sx={{ bgcolor: 'grey.900', color: 'white', textTransform: 'none', '&:hover': { bgcolor: 'grey.800' } }}>Guardar cambios</Button>
          </DialogActions>
        </Dialog>
        <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}><DialogTitle>¿Eliminar pala?</DialogTitle><DialogContent><DialogContentText>Esta acción no se puede deshacer.</DialogContentText></DialogContent><DialogActions><Button onClick={() => setDeleteOpen(false)}>Cancelar</Button><Button color="error" variant="contained" onClick={() => void deleteRacket()}>Eliminar</Button></DialogActions></Dialog>
        <Dialog open={photoOpen} onClose={() => setPhotoOpen(false)}><DialogTitle>¿Deseas actualizar la imagen?</DialogTitle><DialogActions><Button onClick={() => setPhotoOpen(false)}>Cancelar</Button><Button color="error" variant="contained" disabled={!selectedPhoto} onClick={() => void uploadPhoto()}>Confirmar</Button></DialogActions></Dialog>

      <Dialog
        open={dialogOpen}
        onClose={(_, reason) => {
          if (!isSubmitting && reason !== 'backdropClick') setDialogOpen(false);
        }}
        aria-labelledby="racket-booking-title"
        aria-describedby="racket-booking-description"
        slotProps={{ paper: { sx: { width: '100%', maxWidth: 440, m: 2, borderRadius: 3 } } }}
      >
        <DialogTitle id="racket-booking-title" sx={{ fontWeight: 900 }}>Confirmar Reserva</DialogTitle>
        <DialogContent>
          <DialogContentText id="racket-booking-description">
            ¿Seguro que quieres alquilar la pala {racket.brand} {racket.name}?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={isSubmitting} color="inherit">Cancelar</Button>
          <Button onClick={() => void confirmBooking()} disabled={isSubmitting || !user} variant="contained" color="error">
            {isSubmitting ? <CircularProgress size={22} color="inherit" aria-label="Confirmando reserva" /> : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={feedback !== null}
        autoHideDuration={5000}
        onClose={(_, reason) => {
          if (reason !== 'clickaway') setFeedback(null);
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {feedback ? (
          <Alert onClose={() => setFeedback(null)} severity={feedback.severity} variant="filled" sx={{ width: '100%' }}>
            {feedback.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
}

export default RacketDetailPage;
