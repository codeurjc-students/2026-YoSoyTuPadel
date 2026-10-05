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

interface CoachBooking {
  booking: {
    id: number;
    bookingDate: string;
    startTime: string;
    endTime: string;
    bookingPrice: number | null;
    status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  };
  client: {
    id: number;
    name: string | null;
    nickname: string | null;
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
  return booking.booking.bookingDate >= todayValue && booking.booking.status !== 'CANCELLED';
}

function CoachBookingCard({ item, onCancel }: { item: CoachBooking; onCancel: () => void }) {
  const clientName = item.client.name || item.client.nickname || 'Cliente sin nombre';
  const booking = item.booking;

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
            <Typography sx={{ fontSize: '1.2rem', fontWeight: 900, overflowWrap: 'anywhere' }}>{clientName}</Typography>
            <Typography sx={{ color: 'grey.700', fontWeight: 700 }}>
              {formatDate(booking.bookingDate)} · {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
            </Typography>
            <Typography sx={{ color: 'grey.900', fontSize: '1.05rem', fontWeight: 900 }}>
              {booking.bookingPrice?.toFixed(2) ?? '0.00'} €
            </Typography>
          </Stack>
          {isPending(item) ? (
            <Button
              variant="outlined"
              onClick={onCancel}
              sx={{ borderColor: 'grey.800', color: 'grey.900', borderWidth: 2, fontWeight: 'bold', textTransform: 'none', borderRadius: 2, '&:hover': { borderWidth: 2, bgcolor: 'grey.100' } }}
            >
              Cancelar
            </Button>
          ) : (
            <Chip
              color={booking.status === 'CANCELLED' ? 'error' : 'success'}
              label={booking.status === 'CANCELLED' ? 'Cancelada' : 'Terminada'}
              sx={{ alignSelf: { xs: 'flex-start', sm: 'center' }, fontWeight: 800 }}
            />
          )}
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
  const completedBookings = useMemo(() => bookings.filter((booking) => !isPending(booking)), [bookings]);

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
                {items.map((item) => <CoachBookingCard key={item.booking.id} item={item} onCancel={() => setBookingToCancel(item)} />)}
                {items.length === 0 && <Typography sx={{ color: 'grey.400' }}>No hay reservas en esta sección.</Typography>}
              </Stack>
            </Box>
          ))}
        </Stack>
      )}
      <Dialog open={bookingToCancel !== null} onClose={() => setBookingToCancel(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 900 }}>Cancelar sesión</DialogTitle>
        <DialogContent><DialogContentText>¿Estás seguro de cancelar esta sesión?</DialogContentText></DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setBookingToCancel(null)} color="inherit" sx={{ textTransform: 'none' }}>Volver</Button>
          <Button onClick={() => void cancelBooking()} variant="contained" color="error" sx={{ fontWeight: 800, textTransform: 'none' }}>Sí, cancelar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default CoachDashboardPage;
