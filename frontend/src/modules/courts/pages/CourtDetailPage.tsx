import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CardMedia,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { AccessTimeRounded as AccessTimeRoundedIcon } from '@mui/icons-material';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { courtService, type CourtDTO } from '../services/courtService';

const courtImage = '/images/padel-court-overhead.jpg';
const timeSlots = Array.from({ length: 13 }, (_, index) => `${String(index + 9).padStart(2, '0')}:00`);
const spanishDate = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' });
const spanishWeekdayDate = new Intl.DateTimeFormat('es-ES', {
  weekday: 'short',
  day: '2-digit',
  month: 'short',
});

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatBookingDate(value: string): string {
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('es-ES').format(new Date(year, month - 1, day));
}

function getBookingDays(): Date[] {
  return Array.from({ length: 15 }, (_, dayOffset) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + dayOffset);
    return date;
  });
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ message?: string; error?: string; detail?: string }>(error)) {
    if (error.response?.status === 409) {
      return 'Esta hora ya está reservada. Elige otra franja horaria.';
    }
    return error.response?.data?.message
      ?? error.response?.data?.error
      ?? error.response?.data?.detail
      ?? 'No se ha podido completar la reserva. Comprueba la disponibilidad e inténtalo de nuevo.';
  }
  return 'No se ha podido completar la reserva. Inténtalo de nuevo.';
}

function courtTypeLabel(type: string): string {
  return type === 'INDOOR' ? 'Indoor' : type === 'OUTDOOR' ? 'Outdoor' : type;
}

function surfaceLabel(surface: string): string {
  const labels: Record<string, string> = { GLASS: 'Cristal', WALL: 'Muro' };
  return labels[surface] ?? surface;
}

function CourtDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const isAdmin = user?.role.toUpperCase().replace(/^ROLE_/, '') === 'ADMIN';
  const navigate = useNavigate();
  const courtId = Number(id);
  const isValidCourtId = Number.isSafeInteger(courtId) && courtId > 0;
  const [bookingDays] = useState(getBookingDays);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [court, setCourt] = useState<CourtDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => formatDate(new Date()));
  const [selectedTime, setSelectedTime] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'error' });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<{ date: string; slots: string[] } | null>(null);
  const [availabilityErrorDate, setAvailabilityErrorDate] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editForm, setEditForm] = useState<CourtDTO | null>(null);
  const dayListRef = useRef<HTMLDivElement | null>(null);
  const selectedDay = bookingDays.find((date) => formatDate(date) === selectedDate);
  const reservedSlots = availability?.date === selectedDate ? availability.slots : [];
  const isLoadingAvailability = Boolean(court)
    && availability?.date !== selectedDate
    && availabilityErrorDate !== selectedDate;
  const availabilityError = availabilityErrorDate === selectedDate;
  const currentDate = formatDate(currentTime);
  const selectedTimeHasPassed = selectedDate === currentDate
    && selectedTime !== ''
    && selectedTime <= `${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}`;
  const availableSlots = timeSlots.filter((time) => {
    const isPast = selectedDate === currentDate
      && time <= `${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}`;
    return !reservedSlots.includes(time) && !isPast;
  });
  const hasCourtChanges = Boolean(editForm && court && (
    editForm.name !== court.name
    || editForm.courtPrice !== court.courtPrice
    || editForm.type !== court.type
    || editForm.surface !== court.surface
    || editForm.isAvailable !== court.isAvailable
  ));

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!isAuthLoading && (!isAuthenticated || !user)) {
      void navigate('/login', { replace: true, state: { from: `/courts/${id ?? ''}` } });
    }
  }, [id, isAuthLoading, isAuthenticated, user, navigate]);

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated || !user || !id || !isValidCourtId) return;

    const controller = new AbortController();
    void courtService.getCourtById(courtId, controller.signal)
      .then(setCourt)
      .catch(() => {
        if (!controller.signal.aborted) setLoadError('No se ha podido cargar la información de la pista.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [courtId, id, isAuthLoading, isAuthenticated, isValidCourtId, user]);

  useEffect(() => {
    if (!court || isAdmin) return;

    const controller = new AbortController();
    void courtService.getReservedCourtSlots(court.id, selectedDate, controller.signal)
      .then((slots) => {
        setAvailability({ date: selectedDate, slots });
        setAvailabilityErrorDate(null);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setAvailabilityErrorDate(selectedDate);
          setSnackbar({
            open: true,
            severity: 'error',
            message: axios.isAxiosError(error) && error.response?.status === 409
              ? getErrorMessage(error)
              : 'No se han podido consultar los horarios. Inténtalo de nuevo.',
          });
        }
      });

    return () => controller.abort();
  }, [court, isAdmin, selectedDate]);

  const confirmBooking = async () => {
    if (!court || !user || !isAuthenticated || !selectedDate || !selectedTime || selectedTimeHasPassed) return;

    setIsSubmitting(true);
    try {
      await courtService.bookCourt(court.id, user.id, selectedDate, selectedTime);
      setIsDialogOpen(false);
      setIsSuccessDialogOpen(true);
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      setIsDialogOpen(false);
      setSnackbar({ open: true, message, severity: 'error' });
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        setAvailability((current) => ({
          date: selectedDate,
          slots: [...new Set([
            ...(current?.date === selectedDate ? current.slots : []),
            selectedTime,
          ])],
        }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveCourt = async () => {
    if (!editForm) return;
    try {
      const updated = await courtService.updateCourt(editForm);
      setCourt(updated);
      setEditOpen(false);
      setSnackbar({ open: true, message: 'Pista actualizada correctamente', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'No se ha podido actualizar la pista.', severity: 'error' });
    }
  };

  const deleteCourt = async () => {
    if (!court) return;
    try {
      await courtService.deleteCourt(court.id);
      setDeleteOpen(false);
      setSnackbar({ open: true, message: 'Pista eliminada con éxito', severity: 'success' });
      window.setTimeout(() => navigate('/courts', { replace: true }), 1500);
    } catch {
      setSnackbar({ open: true, message: 'No se ha podido eliminar la pista.', severity: 'error' });
    }
  };

  if (isAuthLoading || (!isAuthenticated && !loadError) || (isLoading && isValidCourtId)) {
    return (
      <Box role="status" aria-label="Cargando pista" sx={{ minHeight: '55vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress color="error" />
      </Box>
    );
  }

  return (
    <Box component="section" sx={{ maxWidth: isAdmin ? 800 : 1100, mx: 'auto', width: '100%', px: { xs: 2, sm: 3, lg: 4 }, py: { xs: 3, sm: 5 } }}>
      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button component={Link} to="/courts" color="inherit" sx={{ color: 'rgba(255,255,255,0.75)', textTransform: 'none' }}>
          ← Pistas
        </Button>
        <Box sx={{ width: '1px', height: 24, bgcolor: 'rgba(255,255,255,0.25)' }} />
        <Typography component="h1" variant="h5" sx={{ color: 'white', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {court?.name ?? 'Pista'}
        </Typography>
      </Box>

      {loadError && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{loadError}</Alert>}
      {!isValidCourtId && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>La pista solicitada no es válida.</Alert>}

      {court && (
        <>
        <Grid container spacing={{ xs: 2.5, md: 3 }} sx={{ maxWidth: isAdmin ? 900 : 1100, mx: 'auto' }}>
          <Grid size={{ xs: 12, md: isAdmin ? 12 : 6 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Paper
                elevation={3}
                sx={{
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: 3,
                  height: { xs: 190, sm: 260, md: 288 },
                }}
              >
                <CardMedia
                  component="img"
                  image={courtImage}
                  alt={`Vista de una pista de pádel - ${court.name}`}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <Box sx={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(0deg, rgba(0,0,0,0.6), transparent 55%)',
                }} />
                <Chip
                  label={court.isAvailable ? 'Disponible para reservar' : 'No disponible'}
                  color={court.isAvailable ? 'success' : 'error'}
                  sx={{ position: 'absolute', left: 2.5, bottom: 2.5, fontWeight: 800 }}
                />
              </Paper>
              <Paper elevation={2} sx={{ p: { xs: 2.25, sm: 3 }, borderRadius: 3 }}>
                <Box sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  justifyContent: 'space-between',
                  gap: 1.5,
                }}>
                  <Box>
                    <Typography component="h2" variant="h5" sx={{ color: '#111318', fontWeight: 900 }}>
                      {court.name}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                    <Typography variant="h4" sx={{ color: '#111318', fontWeight: 900, lineHeight: 1 }}>
                      €{court.courtPrice}/h
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#626875' }}>por hora</Typography>
                  </Box>
                </Box>
                <Grid container spacing={2} sx={{ mt: 2, justifyContent: 'center' }}>
                  {[
                    { title: 'Modalidad', value: courtTypeLabel(court.type) },
                    { title: 'Tipo', value: surfaceLabel(court.surface) },
                    { title: 'Estado', value: court.isAvailable ? 'Disponible' : 'No disponible' },
                  ].map(({ title, value }) => (
                    <Grid key={title} size={{ xs: 12, sm: 4 }}>
                      <Box sx={{ height: '100%', p: 1.5, bgcolor: '#f0f1f4', borderRadius: 2, textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ display: 'block', color: title === 'Estado' && !court.isAvailable ? 'error.main' : '#626875', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', whiteSpace: 'normal' }}>
                          {title}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.4, color: title === 'Estado' && !court.isAvailable ? 'error.main' : '#17191e', fontWeight: title === 'Estado' && !court.isAvailable ? 900 : 700, whiteSpace: 'normal' }}>
                          {value}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }} sx={{ display: isAdmin ? 'none' : undefined }}>
            <Paper
              elevation={3}
              sx={{
                position: { md: 'sticky' },
                top: { md: 96 },
                p: { xs: 2.25, sm: 3 },
                borderRadius: 3,
              }}
            >
              <Typography variant="overline" sx={{ color: '#16181d', fontWeight: 900, letterSpacing: '0.14em' }}>
                Seleccionar día
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  mt: 1.25,
                  minWidth: 0,
                }}
              >
                <IconButton
                  aria-label="Días anteriores"
                  onClick={() => {
                    if (dayListRef.current) dayListRef.current.scrollLeft -= 220;
                  }}
                  sx={{ flex: '0 0 auto', color: '#515866', bgcolor: '#f0f1f4', '&:hover': { bgcolor: '#e5e7eb' } }}
                >
                  ‹
                </IconButton>
                <Box
                  ref={dayListRef}
                  sx={{
                    display: 'flex',
                    flex: '1 1 auto',
                    gap: 1,
                    minWidth: 0,
                  overflowX: 'auto',
                    overflowY: 'hidden',
                    pb: 1,
                    scrollBehavior: 'smooth',
                    scrollbarWidth: 'thin',
                  '&::-webkit-scrollbar': { height: 5 },
                  '&::-webkit-scrollbar-thumb': { bgcolor: '#d0d3da', borderRadius: 5 },
                  }}
                >
                  {bookingDays.map((date, index) => {
                  const value = formatDate(date);
                  const label = index === 0
                    ? `Hoy, ${spanishDate.format(date)}`
                    : spanishWeekdayDate.format(date);
                  const isSelected = selectedDate === value;
                  return (
                    <Button
                      key={value}
                      variant={isSelected ? 'contained' : 'outlined'}
                      color={isSelected ? 'error' : 'inherit'}
                      aria-pressed={isSelected}
                      onClick={() => {
                        setSelectedDate(value);
                        setSelectedTime('');
                      }}
                      sx={{
                        flex: '0 0 auto',
                        px: 1.5,
                        minHeight: 42,
                        borderRadius: 2,
                        whiteSpace: 'nowrap',
                        textTransform: 'none',
                        fontWeight: 700,
                        color: isSelected ? 'white' : '#515866',
                        borderColor: '#d8dbe1',
                        bgcolor: isSelected ? undefined : '#f0f1f4',
                      }}
                    >
                      {label}
                    </Button>
                  );
                  })}
                </Box>
                <IconButton
                  aria-label="Días siguientes"
                  onClick={() => {
                    if (dayListRef.current) dayListRef.current.scrollLeft += 220;
                  }}
                  sx={{ flex: '0 0 auto', color: '#515866', bgcolor: '#f0f1f4', '&:hover': { bgcolor: '#e5e7eb' } }}
                >
                  ›
                </IconButton>
              </Box>

              <Typography variant="overline" sx={{ display: 'block', mt: 2.5, color: '#16181d', fontWeight: 900, letterSpacing: '0.14em' }}>
                Horas disponibles
              </Typography>
              {selectedDay && (
                <Typography variant="caption" sx={{ display: 'block', mb: 1.25, color: '#626875' }}>
                  {spanishWeekdayDate.format(selectedDay)}
                </Typography>
              )}
              {isLoadingAvailability && (
                <Box role="status" aria-label="Consultando horarios" sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={22} color="error" />
                </Box>
              )}
              {!isLoadingAvailability && !availabilityError && availableSlots.length === 0 ? (
                <Box sx={{ py: 4, px: 2, textAlign: 'center', bgcolor: 'grey.900', borderRadius: 3, border: '1px solid', borderColor: 'grey.800', my: 2 }}>
                  <AccessTimeRoundedIcon sx={{ color: 'grey.300', fontSize: 34, mb: 1 }} />
                  <Typography sx={{ color: 'white', fontWeight: 900 }}>No hay horas disponibles</Typography>
                  <Typography sx={{ color: 'grey.400', mt: 0.75 }}>
                    Selecciona otra fecha en el calendario para ver las franjas libres.
                  </Typography>
                </Box>
              ) : (
              <Grid container spacing={1}>
                {timeSlots.map((time) => {
                  const isSelected = selectedTime === time;
                  const isReserved = reservedSlots.includes(time);
                  const isPast = selectedDate === currentDate
                    && time <= `${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}`;
                  const isUnavailable = isReserved || isPast;
                  return (
                    <Grid key={time} size={{ xs: 4, sm: 3 }}>
                      <Button
                        fullWidth
                        variant={isSelected ? 'contained' : 'outlined'}
                        color={isSelected ? 'error' : 'inherit'}
                        aria-pressed={isSelected}
                        aria-label={isReserved ? `${time}, reservada` : isPast ? `${time}, no disponible` : time}
                        disabled={isUnavailable || isLoadingAvailability || availabilityError}
                        onClick={() => setSelectedTime(time)}
                        sx={{
                          minHeight: 42,
                          borderRadius: 2,
                          color: isUnavailable ? '#858b96' : isSelected ? 'white' : '#23262d',
                          borderColor: '#d8dbe1',
                          bgcolor: isUnavailable ? '#e5e7eb' : isSelected ? undefined : '#f7f7f9',
                          fontWeight: 800,
                          '&.Mui-disabled': {
                            color: '#858b96',
                            borderColor: '#d8dbe1',
                            bgcolor: '#e5e7eb',
                          },
                          '&:hover': {
                            borderColor: '#e60012',
                            bgcolor: isSelected ? '#c90010' : '#fff1f2',
                          },
                        }}
                      >
                        {time}
                      </Button>
                    </Grid>
                  );
                })}
              </Grid>
              )}

              <Button
                fullWidth
                size="large"
                variant="contained"
                color="primary"
                disabled={!court.isAvailable || !selectedDate || !selectedTime || selectedTimeHasPassed || isLoadingAvailability || availabilityError || reservedSlots.includes(selectedTime)}
                onClick={() => setIsDialogOpen(true)}
                sx={{
                  mt: 2.5,
                  minHeight: 52,
                  borderRadius: 2,
                  bgcolor: '#e60012',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  boxShadow: '0 8px 18px rgba(230,0,18,0.22)',
                  '&:hover': { bgcolor: '#c90010', boxShadow: '0 10px 22px rgba(230,0,18,0.28)' },
                }}
              >
                Finalizar reserva{selectedTime ? ` · ${selectedTime}` : ''}
              </Button>
            </Paper>
          </Grid>
        </Grid>
        {isAdmin && (
          <Stack direction="row" spacing={2} sx={{ justifyContent: 'center', mt: 3 }}>
            <Button variant="contained" onClick={() => { setEditForm({ ...court }); setEditOpen(true); }} sx={{ bgcolor: 'white', color: 'grey.900', fontWeight: 800, textTransform: 'none', borderRadius: 2, '&:hover': { bgcolor: 'grey.200' } }}>Editar</Button>
            <Button variant="contained" color="error" onClick={() => setDeleteOpen(true)} sx={{ fontWeight: 800, textTransform: 'none', borderRadius: 2 }}>Eliminar</Button>
          </Stack>
        )}
        </>
      )}

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { bgcolor: 'white', borderRadius: 3, color: 'grey.900' } } }}>
        <DialogTitle sx={{ color: 'grey.900', fontWeight: 900 }}>Editar pista</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField variant="outlined" label="Nombre" value={editForm?.name ?? ''} onChange={(event) => setEditForm((current) => current ? { ...current, name: event.target.value } : current)} fullWidth />
            <TextField variant="outlined" label="Precio por hora" type="number" value={editForm?.courtPrice ?? ''} onChange={(event) => setEditForm((current) => current ? { ...current, courtPrice: Number(event.target.value) } : current)} fullWidth />
            <TextField select variant="outlined" label="Modalidad" value={editForm?.type ?? ''} onChange={(event) => setEditForm((current) => current ? { ...current, type: event.target.value } : current)} fullWidth>
              <MenuItem value="INDOOR">INDOOR</MenuItem>
              <MenuItem value="OUTDOOR">OUTDOOR</MenuItem>
            </TextField>
            <TextField select variant="outlined" label="Tipo de superficie" value={editForm?.surface ?? ''} onChange={(event) => setEditForm((current) => current ? { ...current, surface: event.target.value } : current)} fullWidth>
              <MenuItem value="WALL">MURO</MenuItem>
              <MenuItem value="GLASS">CRISTAL</MenuItem>
            </TextField>
            <TextField select variant="outlined" label="Estado" value={editForm?.isAvailable ? 'true' : 'false'} onChange={(event) => setEditForm((current) => current ? { ...current, isAvailable: event.target.value === 'true' } : current)} fullWidth>
              <MenuItem value="true">Disponible</MenuItem>
              <MenuItem value="false">No disponible</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)} variant="text" sx={{ color: 'grey.700', textTransform: 'none' }}>Cancelar</Button>
          <Button disabled={!hasCourtChanges} variant="contained" color="error" onClick={() => void saveCourt()} sx={{ textTransform: 'none' }}>Guardar cambios</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}><DialogTitle>¿Eliminar pista?</DialogTitle><DialogContent><DialogContentText>Esta acción no se puede deshacer.</DialogContentText></DialogContent><DialogActions><Button onClick={() => setDeleteOpen(false)}>Cancelar</Button><Button color="error" variant="contained" onClick={() => void deleteCourt()}>Eliminar</Button></DialogActions></Dialog>

      <Dialog
        open={isDialogOpen}
        onClose={() => {
          if (!isSubmitting) setIsDialogOpen(false);
        }}
        slotProps={{ paper: { sx: { width: '100%', maxWidth: 440, m: 2, borderRadius: 3 } } }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>Confirmar reserva</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Confirmar reserva de {court?.name ?? 'esta pista'} para el día {formatBookingDate(selectedDate)} a las {selectedTime}?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setIsDialogOpen(false)} disabled={isSubmitting} color="inherit">
            Volver
          </Button>
          <Button onClick={() => void confirmBooking()} disabled={isSubmitting} variant="contained" color="error">
            {isSubmitting ? <CircularProgress size={21} color="inherit" /> : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isSuccessDialogOpen}
        onClose={() => setIsSuccessDialogOpen(false)}
        aria-labelledby="booking-success-title"
        slotProps={{ paper: { sx: { width: '100%', maxWidth: 420, m: 2, p: { xs: 2, sm: 3 }, borderRadius: 3 } } }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', py: 1 }}>
          <Box sx={{ display: 'grid', width: 64, height: 64, placeItems: 'center', borderRadius: 2, bgcolor: '#d1fae5', color: '#059669', fontSize: 38, fontWeight: 700 }}>
            ✓
          </Box>
          <Typography id="booking-success-title" component="h2" variant="h5" sx={{ mt: 2.5, color: '#111318', fontWeight: 900, lineHeight: 1.15 }}>
            ¡Reserva confirmada!
          </Typography>
          <Typography sx={{ mt: 1, color: '#17191e', fontWeight: 800 }}>
            {court?.name}
          </Typography>
          <Typography sx={{ mt: 0.5, color: '#626875' }}>
            {formatBookingDate(selectedDate)} · <Box component="span" sx={{ color: '#17191e', fontWeight: 800 }}>{selectedTime}</Box>
          </Typography>
          {court && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%', mt: 2.5, p: 1.75, borderRadius: 2, bgcolor: '#f0f1f4', textAlign: 'left' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                <Typography variant="body2" sx={{ color: '#626875' }}>Precio</Typography>
                <Typography variant="body2" sx={{ color: '#17191e', fontWeight: 800 }}>€{court.courtPrice}/h</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                <Typography variant="body2" sx={{ color: '#626875' }}>Tipo</Typography>
                <Typography variant="body2" sx={{ color: '#17191e', fontWeight: 800 }}>{surfaceLabel(court.surface)} {courtTypeLabel(court.type)}</Typography>
              </Box>
            </Box>
          )}
          <Button
            fullWidth
            variant="contained"
            color="error"
            onClick={() => {
              setIsSuccessDialogOpen(false);
              void navigate('/courts');
            }}
            sx={{ mt: 2.5, minHeight: 46, borderRadius: 2, fontWeight: 900, textTransform: 'none' }}
          >
            Volver a pistas
          </Button>
        </Box>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={7000}
        onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.severity}
          variant="standard"
          onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
          sx={{
            width: { xs: 'calc(100vw - 32px)', sm: 420 },
            borderRadius: 2.5,
            bgcolor: 'white',
            color: '#252830',
            boxShadow: '0 12px 36px rgba(0,0,0,0.22)',
            fontSize: 16,
            '& .MuiAlert-icon': { fontSize: 24, alignItems: 'center' },
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default CourtDetailPage;
