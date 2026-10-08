import axios from 'axios';
import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CardMedia,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import { AccessTimeRounded as AccessTimeRoundedIcon } from '@mui/icons-material';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { coachService, type CoachDTO } from '../services/coachService';

const coachImage = '/images/coach-training.jpg';
const timeSlots = ['09:00', '11:00', '13:00', '15:00', '17:00', '19:00'];
const dateLabel = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' });
const weekdayDateLabel = new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: '2-digit', month: 'short' });

function getCoachLevelAudience(level: CoachDTO['skillLevel']): string {
  switch (level) {
    case 1:
      return 'Para principiantes';
    case 2:
      return 'Para juveniles y junior';
    case 3:
      return 'Avanzado o alto rendimiento';
    default:
      return 'Especialidad no especificada';
  }
}

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

function isPastTimeSlot(date: string, time: string, now = new Date()): boolean {
  return date === formatDate(now) && Number(time.slice(0, 2)) <= now.getHours();
}

function getBookingDays(): Date[] {
  return Array.from({ length: 15 }, (_, offset) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + offset);
    return date;
  });
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ message?: string; error?: string; detail?: string }>(error)) {
    if (error.response?.status === 409) return 'El entrenador ya tiene una sesión reservada en esa franja. Elige otra hora.';
    return error.response?.data?.message
      ?? error.response?.data?.error
      ?? error.response?.data?.detail
      ?? 'No se ha podido completar la reserva. Inténtalo de nuevo.';
  }
  return 'No se ha podido completar la reserva. Inténtalo de nuevo.';
}

function CoachDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const coachId = Number(id);
  const isValidCoachId = Number.isSafeInteger(coachId) && coachId > 0;
  const [days] = useState(getBookingDays);
  const [coach, setCoach] = useState<CoachDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => formatDate(new Date()));
  const [selectedTime, setSelectedTime] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<{ date: string; slots: string[] } | null>(null);
  const [availabilityErrorDate, setAvailabilityErrorDate] = useState<string | null>(null);
  const reservedSlots = availability?.date === selectedDate ? availability.slots : [];
  const isLoadingAvailability = Boolean(coach)
    && availability?.date !== selectedDate
    && availabilityErrorDate !== selectedDate;
  const availabilityError = availabilityErrorDate === selectedDate;
  const availableSlots = timeSlots.filter((time) => !reservedSlots.includes(time) && !isPastTimeSlot(selectedDate, time));

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      void navigate('/login', { replace: true, state: { from: `/coaches/${id ?? ''}` } });
    }
  }, [id, isAuthLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated || !id || !isValidCoachId) return;
    const controller = new AbortController();
    void coachService.getCoachById(coachId, controller.signal)
      .then(setCoach)
      .catch(() => {
        if (!controller.signal.aborted) setLoadError('No se ha podido cargar la información del entrenador.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [coachId, id, isAuthLoading, isAuthenticated, isValidCoachId]);

  useEffect(() => {
    if (!coach) return;
    const controller = new AbortController();
    void coachService.getReservedCoachSlots(coach.id, selectedDate, controller.signal)
      .then((slots) => {
        setAvailability({ date: selectedDate, slots });
        setAvailabilityErrorDate(null);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setAvailabilityErrorDate(selectedDate);
          setSnackbar({ open: true, message: 'No se han podido consultar los horarios. Inténtalo de nuevo.' });
        }
      });
    return () => controller.abort();
  }, [coach, selectedDate]);

  const confirmBooking = async () => {
    if (!coach || !user || !isAuthenticated || !selectedDate || !selectedTime
      || isPastTimeSlot(selectedDate, selectedTime) || reservedSlots.includes(selectedTime)
      || isLoadingAvailability || availabilityError) return;
    setIsSubmitting(true);
    try {
      await coachService.bookCoach(coach.id, user.id, selectedDate, selectedTime);
      setIsDialogOpen(false);
      setIsSuccessDialogOpen(true);
    } catch (error: unknown) {
      setIsDialogOpen(false);
      setSnackbar({ open: true, message: getErrorMessage(error) });
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

  if (isAuthLoading || !isAuthenticated || (isLoading && isValidCoachId)) {
    return (
      <Box role="status" aria-label="Cargando entrenador" sx={{ minHeight: '55vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress color="error" />
      </Box>
    );
  }

  return (
    <Box component="section" sx={{ maxWidth: 950, mx: 'auto', width: '100%', px: { xs: 2, sm: 3, lg: 4 }, py: { xs: 3, sm: 5 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button component={Link} to="/coaches" color="inherit" sx={{ color: 'rgba(255,255,255,0.75)', textTransform: 'none' }}>
          ← Entrenadores
        </Button>
        <Box sx={{ width: '1px', height: 24, bgcolor: 'rgba(255,255,255,0.25)' }} />
        <Typography component="h1" variant="h5" sx={{ color: 'white', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {coach?.name ?? 'Entrenador'}
        </Typography>
      </Box>

      {loadError && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{loadError}</Alert>}
      {!isValidCoachId && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>El entrenador solicitado no es válido.</Alert>}

      {coach && (
        <Grid container spacing={{ xs: 2.5, md: 3 }} sx={{ alignItems: 'stretch' }}>
          <Grid size={{ xs: 12, md: 5 }} sx={{ position: 'relative', minHeight: { xs: 400, md: 'auto' } }}>
            <Box sx={{ position: { xs: 'relative', md: 'absolute' }, top: 0, left: 0, right: 0, bottom: 0, height: '100%' }}>
              <CardMedia
                component="img"
                image={coachService.getCoachImageUrl(coach.id)}
                alt={`Entrenamiento de pádel con ${coach.name}`}
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = coachImage;
                }}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'top center',
                  borderRadius: 4,
                }}
              />
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 7 }}>
            <Stack spacing={3}>
              <Paper elevation={2} sx={{ p: { xs: 2.25, sm: 3 }, borderRadius: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', gap: 1.5 }}>
                  <Typography component="h2" variant="h4" sx={{ color: '#111318', fontWeight: 900 }}>
                    {coach.name}
                  </Typography>
                  <Box sx={{ textAlign: { xs: 'left', sm: 'right' }, flexShrink: 0 }}>
                    <Typography variant="h4" sx={{ color: '#111318', fontWeight: 900, lineHeight: 1 }}>
                      {coach.sessionPrice == null ? 'Consultar' : `€${coach.sessionPrice}`}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#626875' }}>por sesión</Typography>
                  </Box>
                </Box>
                <Grid container spacing={1.25} sx={{ mt: 2 }}>
                  <Grid size={{ xs: 12, sm: 5 }}>
                    <Box sx={{ height: '100%', p: 1.5, bgcolor: '#f0f1f4', borderRadius: 2 }}>
                      <Typography variant="caption" sx={{ display: 'block', color: '#626875', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                        Certificación FEP
                      </Typography>
                      <Typography variant="subtitle1" sx={{ mt: 0.4, color: '#17191e', fontWeight: 700, fontSize: '1rem' }}>
                        FEP Nivel {coach.skillLevel ?? '—'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 7 }}>
                    <Box sx={{ height: '100%', p: 1.5, bgcolor: '#f0f1f4', borderRadius: 2 }}>
                      <Typography variant="caption" sx={{ display: 'block', color: '#626875', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                        Especialidad
                      </Typography>
                      <Typography variant="subtitle1" sx={{ mt: 0.8, color: '#17191e', fontWeight: 700, fontSize: '1rem' }}>
                        {getCoachLevelAudience(coach.skillLevel)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              <Paper elevation={2} sx={{ p: { xs: 2.25, sm: 3 }, borderRadius: 3 }}>
                <Typography variant="overline" sx={{ color: '#16181d', fontWeight: 900, letterSpacing: '0.14em' }}>
                  Seleccionar día
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, mt: 1.25, pb: 1, overflowX: 'auto', scrollbarWidth: 'thin', '&::-webkit-scrollbar': { height: 5 }, '&::-webkit-scrollbar-thumb': { bgcolor: '#d0d3da', borderRadius: 5 } }}>
                  {days.map((date, index) => {
                    const value = formatDate(date);
                    const label = index === 0 ? `Hoy, ${dateLabel.format(date)}` : weekdayDateLabel.format(date);
                    const selected = selectedDate === value;
                    return (
                      <Button
                        key={value}
                        variant={selected ? 'contained' : 'outlined'}
                        color={selected ? 'error' : 'inherit'}
                        aria-pressed={selected}
                        onClick={() => {
                          setSelectedDate(value);
                          setSelectedTime('');
                        }}
                        sx={{ flex: '0 0 auto', px: 1.5, minHeight: 42, borderRadius: 2, whiteSpace: 'nowrap', textTransform: 'none', fontWeight: selected ? 800 : 700, fontSize: selected ? '1rem' : undefined, color: selected ? 'white' : '#515866', borderColor: '#d8dbe1', bgcolor: selected ? undefined : '#f0f1f4' }}
                      >
                        {label}
                      </Button>
                    );
                  })}
                </Box>

                <Typography variant="overline" sx={{ display: 'block', mt: 2.5, color: '#16181d', fontWeight: 900, letterSpacing: '0.14em' }}>
                  Horas disponibles
                </Typography>
                {isLoadingAvailability && (
                  <Box role="status" aria-label="Consultando horarios" sx={{ display: 'flex', justifyContent: 'center', py: 1.5 }}>
                    <CircularProgress size={22} color="error" />
                  </Box>
                )}
                {availabilityError && (
                  <Alert severity="error" sx={{ mt: 1, borderRadius: 2 }}>
                    No se han podido consultar los horarios. Inténtalo de nuevo seleccionando otra fecha.
                  </Alert>
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
                <Grid container spacing={1} sx={{ mt: 0.5 }}>
                  {timeSlots.map((time) => {
                    const selected = selectedTime === time;
                    const isPast = isPastTimeSlot(selectedDate, time);
                    const isReserved = reservedSlots.includes(time);
                    const isUnavailable = isPast || isReserved;
                    return (
                      <Grid key={time} size={{ xs: 4, sm: 4 }}>
                        <Button
                          fullWidth
                          disabled={isUnavailable || isLoadingAvailability || availabilityError}
                          variant={selected ? 'contained' : 'outlined'}
                          color={selected ? 'error' : 'inherit'}
                          aria-pressed={selected}
                          aria-label={isReserved ? `${time}, reservada` : isPast ? `${time}, no disponible` : time}
                          onClick={() => setSelectedTime(time)}
                          sx={{ minHeight: 44, borderRadius: 2, color: isUnavailable ? '#858b96' : selected ? 'white' : '#23262d', borderColor: '#d8dbe1', bgcolor: isUnavailable ? '#e5e7eb' : selected ? undefined : '#f7f7f9', fontWeight: 800, '&:hover': { borderColor: '#e60012', bgcolor: selected ? '#c90010' : '#fff1f2' }, '&.Mui-disabled': { color: '#858b96', borderColor: '#d8dbe1', bgcolor: '#e5e7eb' } }}
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
                  color="error"
                  disabled={!selectedDate || !selectedTime || isPastTimeSlot(selectedDate, selectedTime)
                    || reservedSlots.includes(selectedTime) || isLoadingAvailability || availabilityError}
                  onClick={() => setIsDialogOpen(true)}
                  sx={{ mt: 2.5, minHeight: 52, borderRadius: 2, bgcolor: '#e60012', fontWeight: 900, textTransform: 'uppercase', boxShadow: '0 8px 18px rgba(230,0,18,0.22)', '&:hover': { bgcolor: '#c90010' } }}
                >
                  Reservar sesión{selectedTime ? ` · ${selectedTime}` : ''}
                </Button>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      )}

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
            ¿Confirmar sesión con {coach?.name} para el {formatBookingDate(selectedDate)} a las {selectedTime}?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setIsDialogOpen(false)} disabled={isSubmitting} color="inherit">Cancelar</Button>
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
            {coach?.name}
          </Typography>
          <Typography sx={{ mt: 0.5, color: '#626875' }}>
            {formatBookingDate(selectedDate)} · <Box component="span" sx={{ color: '#17191e', fontWeight: 800 }}>{selectedTime}</Box>
          </Typography>
          {coach && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%', mt: 2.5, p: 1.75, borderRadius: 2, bgcolor: '#f0f1f4', textAlign: 'left' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                <Typography variant="body2" sx={{ color: '#626875' }}>Duración</Typography>
                <Typography variant="body2" sx={{ color: '#17191e', fontWeight: 800 }}>2 horas</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                <Typography variant="body2" sx={{ color: '#626875' }}>Tipo</Typography>
                <Typography variant="body2" sx={{ color: '#17191e', fontWeight: 800 }}>Entrenamiento</Typography>
              </Box>
            </Box>
          )}
          <Button
            fullWidth
            variant="contained"
            color="error"
            onClick={() => {
              setIsSuccessDialogOpen(false);
              void navigate('/coaches');
            }}
            sx={{ mt: 2.5, minHeight: 46, borderRadius: 2, fontWeight: 900, textTransform: 'none' }}
          >
            Volver a entrenadores
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
          severity="error"
          variant="standard"
          onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
          sx={{
            width: { xs: 'calc(100vw - 32px)', sm: 420 },
            borderRadius: 2.5,
            bgcolor: 'white',
            color: '#252830',
            boxShadow: '0 12px 36px rgba(0,0,0,0.22)',
            fontSize: 16,
            '& .MuiAlert-icon': { color: '#e60012', fontSize: 24, alignItems: 'center' },
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default CoachDetailPage;
