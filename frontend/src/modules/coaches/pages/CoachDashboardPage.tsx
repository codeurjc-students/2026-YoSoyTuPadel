import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import api from '../../../service/api';
import { authService } from '../../auth/services/authService';
import { useAuth } from '../../auth/hooks/useAuth';
import { coachService } from '../services/coachService';

interface CoachBooking {
  booking: {
    id: number;
    bookingDate: string;
    startTime: string;
    endTime: string;
    bookingPrice: number | null;
    status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
    score?: string | null;
  };
  client: {
    id: number;
    name: string | null;
    nickname: string | null;
    skillLevel?: number | null;
  };
}

const cardSx = {
  borderRadius: 4,
  bgcolor: 'white',
  color: 'grey.900',
  boxShadow: '0 16px 35px rgba(0,0,0,0.12)',
};

function initials(name: string) {
  return name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
}

function formatDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, day));
}

function formatTime(value: string) {
  return value.slice(0, 5);
}

function isPending(booking: CoachBooking) {
  const today = new Date();
  const todayValue = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');
  return booking.booking.bookingDate >= todayValue && booking.booking.status === 'PENDING';
}

function hasBookingScore(booking: CoachBooking) {
    const score = booking.booking.score;
    return score !== null && score !== undefined && score.trim() !== '';
}

function isPendingEvaluation(booking: CoachBooking) {
    return booking.booking.status === 'COMPLETED' && !hasBookingScore(booking);
}

function compareCompletedBookings(a: CoachBooking, b: CoachBooking) {
    const aPendingEval = isPendingEvaluation(a);
    const bPendingEval = isPendingEvaluation(b);

    if (aPendingEval !== bPendingEval) {
        return aPendingEval ? -1 : 1;
    }

    const dateComparison = b.booking.bookingDate.localeCompare(a.booking.bookingDate);
    if (dateComparison !== 0) {
        return dateComparison;
    }

    return b.booking.startTime.localeCompare(a.booking.startTime);
}

const SCORE_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function getScoreDescription(score: number| null): string {
  if (score === null) return `Selecciona una puntuación del 0 al 10`;
  if (score === 0) return 'Nivel muy por debajo del actual';
  if (score < 5) return `Nivel por debajo del actual`;
  if (score === 5) return 'Nivel adecuado';
  if (score < 10) return `Nivel por encima del actual`;
  return 'Nivel muy por encima del actual';
}

function CoachBookingCard({
        item,
        onCancel,
        onEvaluate,
      }: Readonly<{
        item: CoachBooking;
        onCancel: () => void;
        onEvaluate: () => void;
      }>) {

  const clientName = item.client.name || item.client.nickname || 'Cliente sin nombre';
  const booking = item.booking;
  const hasScore = booking.score !== null && booking.score !== undefined && booking.score.trim() !== '';

  const statusChipSx = {
    width: 115,
    justifyContent: 'center',
    fontWeight: 800,
  };

  let statusAction = null;

  if (isPending(item)) {
    statusAction = (
        <Button
            variant="contained"
            onClick={onCancel}
            sx={{
              bgcolor: '#e60012',
              color: 'white',
              fontWeight: 800,
              textTransform: 'none',
              borderRadius: 2,
              px: 2.5,
              '&:hover': { bgcolor: '#b8000e' },
            }}
        >
          Cancelar
        </Button>
    );
  } else if (booking.status === 'CANCELLED') {
    statusAction = (
        <Chip
            color="error"
            label="Cancelada"
            sx={{ ...statusChipSx, alignSelf: { xs: 'flex-start', sm: 'center' } }}
        />
    );
  } else {
    let evaluationBadge = null;
    if (hasScore) {
      evaluationBadge = (
          <Chip
              color="success"
              label={`CALIFICADO (${booking.score}/10)`}
              sx={{
                width: 200,
                justifyContent: 'center',
                fontWeight: 900,
                letterSpacing: '0.04em',
              }}
          />
      );
    } else if (booking.status === 'COMPLETED') {
      evaluationBadge = (
          <Button
              variant="contained"
              onClick={onEvaluate}
              sx={{
                width: 200,
                whiteSpace: 'nowrap',
                bgcolor: '#e60012',
                color: 'white',
                fontWeight: 800,
                borderRadius: 2,
                px: 2,
                '&:hover': { bgcolor: '#b8000e' },
              }}
          >
            CALIFICAR ALUMNO
          </Button>
      );
    }

    statusAction = (
        <Stack
            direction="row"
            spacing={1.5}
            sx={{ alignItems: 'center', alignSelf: { xs: 'flex-start', sm: 'center' }, flexWrap: 'wrap' }}
        >
          {evaluationBadge}
          <Chip color="success" label="Completada" sx={statusChipSx} />
        </Stack>
    );
  }

  return (
    <Card sx={{ ...cardSx, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: 6 } }}>
      <CardContent sx={{ p: { xs: 2, sm: 2.5 }, '&:last-child': { pb: { xs: 2, sm: 2.5 } } }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} sx={{ alignItems: { xs: 'stretch', sm: 'center' } }}>
          <Avatar
            src={`/api/v1/users/${item.client.id}/image`}
            alt={clientName}
            sx={{ width: 76, height: 76, bgcolor: '#e60012', fontWeight: 900, fontSize: 24 }}
          >
            {initials(clientName)}
          </Avatar>
          <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: '1.2rem', fontWeight: 900, overflowWrap: 'anywhere' }}>
              {clientName}
              {typeof item.client.skillLevel === 'number' && (
                  <Box component="span" sx={{ fontWeight: 800 }}>
                    {` - Nivel ${item.client.skillLevel.toFixed(2)}`}
                  </Box>
              )}
            </Typography>
            <Typography sx={{ color: 'grey.700', fontWeight: 700 }}>
              {formatDate(booking.bookingDate)} · {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
            </Typography>
            <Typography sx={{ color: 'grey.900', fontSize: '1.05rem', fontWeight: 900 }}>
              {booking.bookingPrice?.toFixed(2) ?? '0.00'} €
            </Typography>
          </Stack>
          {statusAction}
        </Stack>
      </CardContent>
    </Card>
  );
}

function CoachDashboardPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<CoachBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [bookingToCancel, setBookingToCancel] = useState<CoachBooking | null>(null);
  const [bookingToEvaluate, setBookingToEvaluate] = useState<CoachBooking | null>(null);
  const [selectedScore, setSelectedScore] = useState<number| null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void api.get<CoachBooking[]>('/api/v1/bookings/coach', { signal: controller.signal })
      .then(({ data }) => setBookings(data))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setLoadError(authService.getErrorMessage(error));
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [user?.id]);

  const pendingBookings = useMemo(() => bookings.filter(isPending), [bookings]);
  const completedBookings = useMemo(() => bookings.filter((booking) => !isPending(booking)).sort(compareCompletedBookings), [bookings],);

  const cancelBooking = async () => {
    if (!bookingToCancel) return;
    try {
      await api.patch(`/api/v1/bookings/${bookingToCancel.booking.id}`);
      setBookings((current) => current.map((item) => item.booking.id === bookingToCancel.booking.id
        ? { ...item, booking: { ...item.booking, status: 'CANCELLED' } }
        : item));
      setBookingToCancel(null);
    } catch (error: unknown) {
      setLoadError(authService.getErrorMessage(error));
    }
  };

  const openEvaluateDialog = (item: CoachBooking) => {
    setSelectedScore(null);
    setBookingToEvaluate(item);
  };

  const handleEvaluate = async () => {
    if (!bookingToEvaluate || selectedScore === null) return;
    setIsEvaluating(true);
    try {
      const updated = await coachService.evaluateTraining(bookingToEvaluate.booking.id, selectedScore);
        const targetClientId = updated.client.id ?? bookingToEvaluate.client.id;
        const updatedSkillLevel = updated.client.skillLevel;

        setBookings((current) =>
            current.map((item) => {
                const isEvaluatedBooking = item.booking.id === updated.booking.id;
                const isSameClient = item.client.id === targetClientId;

                if (!isEvaluatedBooking && !isSameClient) {
                    return item;
                }

                return {
                    booking: isEvaluatedBooking
                        ? { ...item.booking, status: updated.booking.status, score: updated.booking.score }
                        : item.booking,
                    client:
                        isSameClient && typeof updatedSkillLevel === 'number'
                            ? { ...item.client, skillLevel: updatedSkillLevel }
                            : item.client,
                };
            }),
        );
      setBookingToEvaluate(null);
    } catch (error: unknown) {
      setLoadError(authService.getErrorMessage(error));
      setBookingToEvaluate(null);
    } finally {
      setIsEvaluating(false);
    }
  };

  const studentToEvaluateName = bookingToEvaluate?.client.name
      || bookingToEvaluate?.client.nickname
      || 'el alumno';

  let descriptionColor = 'grey.900';
  if (selectedScore === null) {
    descriptionColor = 'text.secondary';
  } else if (selectedScore < 5) {
    descriptionColor = 'error.main';
  } else if (selectedScore > 5) {
    descriptionColor = 'success.main';
  }

  return (
    <Box component="section" sx={{ maxWidth: 1220, mx: 'auto', px: { xs: 2, sm: 3, lg: 4 }, py: { xs: 4, sm: 7 } }}>
      <Typography component="h1" align="center" sx={{ color: 'white', fontSize: { xs: 24, sm: 30 }, fontWeight: 900, letterSpacing: '0.16em', mb: 4 }}>
        PANEL DE ENTRENADOR
      </Typography>
      {isLoading && <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}><CircularProgress color="error" /></Box>}
      {!isLoading && loadError && <Alert severity="error" sx={{ mb: 3 }}>{loadError}</Alert>}
      {!isLoading && !loadError && (
        <Stack spacing={4}>
          {[
            { title: 'Reservas pendientes', items: pendingBookings },
            { title: 'Reservas terminadas', items: completedBookings },
          ].map(({ title, items }) => (
            <Box key={title}>
              <Typography sx={{ color: 'white', fontSize: 20, fontWeight: 900, mb: 2 }}>{title}</Typography>
              <Stack spacing={2}>
                {items.map((item) => <CoachBookingCard key={item.booking.id} item={item} onCancel={() => setBookingToCancel(item)} onEvaluate={() => openEvaluateDialog(item)} />)}
                {items.length === 0 && <Typography sx={{ color: 'grey.400' }}>No hay reservas en esta sección.</Typography>}
              </Stack>
            </Box>
          ))}
        </Stack>
      )}
      <Dialog
          open={bookingToCancel !== null}
          onClose={() => setBookingToCancel(null)}
          fullWidth
          maxWidth="xs"
          slotProps={{
            paper: {
              sx: { borderRadius: 4, p: 0.5 },
            },
          }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>Cancelar sesión</DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          <DialogContentText sx={{ color: 'grey.900' }}>
            ¿Estás seguro de cancelar esta sesión?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
          <Button
              onClick={() => setBookingToCancel(null)}
              color="inherit"
              sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Volver
          </Button>
          <Button
              onClick={() => void cancelBooking()}
              variant="contained"
              sx={{
                bgcolor: '#e60012',
                '&:hover': { bgcolor: '#b8000e' },
                fontWeight: 800,
                textTransform: 'none',
              }}
          >
            Sí, cancelar
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
          open={bookingToEvaluate !== null}
          onClose={() => !isEvaluating && setBookingToEvaluate(null)}
          fullWidth
          slotProps={{
            paper: {
              sx: {  borderRadius: 4, p: 0.5 },
            },
          }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>
          Calificar a {studentToEvaluateName}
        </DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          <DialogContentText sx={{ mb: 3.5, color: 'grey.900' }}>
            Evalúa su rendimiento en el entrenamiento en relación a su nivel
            {typeof bookingToEvaluate?.client.skillLevel === 'number'
                ? ` (${bookingToEvaluate.client.skillLevel.toFixed(2)})`
                : ''}
          </DialogContentText>

          <Stack direction="row" sx={{ justifyContent:"space-between", mb: 1, px: 0.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'error.main' }}>
              0: Muy por debajo
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'grey.800' }}>
              5: Nivel adecuado
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'success.main' }}>
              10: Muy por encima
            </Typography>
          </Stack>

          <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(11, minmax(0, 1fr))',
                gap: 0.75,
                my: 2,
              }}
          >
            {SCORE_OPTIONS.map((score) => {
              const isSelected = selectedScore === score;

              return (
                  <Button
                      key={score}
                      variant={isSelected ? 'contained' : 'outlined'}
                      onClick={() => setSelectedScore(score)}
                      sx={{
                        minWidth: 0,
                        px: 0,
                        py: 1,
                        fontWeight: 900,
                        borderRadius: 2,
                        borderWidth: 1,
                        borderColor: isSelected ? '#e60012' : 'grey.400',
                        bgcolor: isSelected ? '#e60012' : 'transparent',
                        color: isSelected ? 'white' : 'grey.900',
                        '&:hover': {
                          bgcolor: isSelected ? '#b8000e' : 'grey.100',
                          borderColor: isSelected ? '#b8000e' : 'grey.900',
                        },
                      }}
                  >
                    {score}
                  </Button>
              );
            })}
          </Box>

          <Box sx={{ p: 2,  textAlign: 'center' }}>
            <Typography
                variant="body2"
                sx={{ fontWeight: 800, color: descriptionColor}}
            >
              {getScoreDescription(selectedScore)}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
          <Button
              onClick={() => setBookingToEvaluate(null)}
              disabled={isEvaluating}
              color="inherit"
              sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Cancelar
          </Button>
          <Button
              onClick={() => void handleEvaluate()}
              disabled={isEvaluating|| selectedScore === null}
              variant="contained"
              sx={{
                bgcolor: '#e60012',
                '&:hover': { bgcolor: '#b8000e' },
                fontWeight: 800,
                textTransform: 'none',
              }}
          >
            {isEvaluating ? 'Guardando...' : 'Confirmar calificación'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default CoachDashboardPage;
