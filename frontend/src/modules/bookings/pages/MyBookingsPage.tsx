import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
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
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { racketService } from '../../rackets/services/racketService';
import { bookingService, type BookingItem, type BookingItemType } from '../services/bookingService';

type BookingTab = 'all' | BookingItemType;
const ITEMS_PER_PAGE = 10;

const tabs: { value: BookingTab; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'court', label: 'Partidos' },
  { value: 'coach', label: 'Entrenamientos' },
  { value: 'racket', label: 'Material' },
];

const typeLabels: Record<BookingItemType, string> = {
  court: 'Partido',
  coach: 'Entrenamiento',
  racket: 'Material',
};

const typeColors: Record<BookingItemType, 'success' | 'info' | 'warning'> = {
  court: 'success',
  coach: 'info',
  racket: 'warning',
};

function formatDate(value: string): string {
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, day));
}

function hasBookingPassed(booking: BookingItem): boolean {
  if (!booking.date || !booking.time) return false;
  const [year, month, day] = booking.date.split('-').map(Number);
  const [hour, minute] = booking.time.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute).getTime() <= Date.now();
}

function EmptyState({ tab }: { tab: BookingTab }) {
  const isMaterial = tab === 'racket';
  const isAll = tab === 'all';

  return (
    <Paper elevation={2} sx={{ px: 3, py: { xs: 5, sm: 7 }, borderRadius: 3, textAlign: 'center' }}>
      <EventBusyIcon sx={{ color: '#e60012', fontSize: 56 }} />
      <Typography component="h2" variant="h5" sx={{ mt: 1.5, color: '#17191e', fontWeight: 900 }}>
        No tienes reservas en esta categoría
      </Typography>
      <Typography sx={{ mt: 1, color: '#626875' }}>
        Cuando tengas reservas o material alquilado, aparecerán aquí.
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 1.5, mt: 3 }}>
        {(isAll || !isMaterial) && (
          <Button component={Link} to="/courts" variant="contained" color="error" sx={{ borderRadius: 2, fontWeight: 800, textTransform: 'none' }}>
            Explorar pistas
          </Button>
        )}
        {(isAll || !isMaterial) && (
          <Button component={Link} to="/coaches" variant="outlined" color="error" sx={{ borderRadius: 2, fontWeight: 800, textTransform: 'none' }}>
            Explorar entrenadores
          </Button>
        )}
        {isMaterial && (
          <Button component={Link} to="/rackets" variant="contained" color="error" sx={{ borderRadius: 2, fontWeight: 800, textTransform: 'none' }}>
            Explorar palas
          </Button>
        )}
      </Box>
    </Paper>
  );
}

function MyBookingsPage() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const userId = user?.id;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [pendingLimit, setPendingLimit] = useState(ITEMS_PER_PAGE);
  const [historyLimit, setHistoryLimit] = useState(ITEMS_PER_PAGE);
  const tabParam = searchParams.get('tab');
  const initialTab: BookingTab = tabParam === 'material' ? 'racket'
    : tabs.some((tab) => tab.value === tabParam) ? tabParam as BookingTab : 'all';
  const [tabValue, setTabValue] = useState<BookingTab>(initialTab);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);
  const [itemToActOn, setItemToActOn] = useState<BookingItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      navigate('/login', { replace: true, state: { from: '/bookings' } });
    }
  }, [isAuthLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated || userId === undefined) return;
    const controller = new AbortController();
    void bookingService.getUserBookings(userId, controller.signal)
      .then(setBookings)
      .catch(() => {
        if (!controller.signal.aborted) setError('No se han podido cargar tus reservas. Inténtalo de nuevo.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [isAuthenticated, reloadCount, userId]);

  const filteredBookings = useMemo(
    () => {
      if (tabValue === 'all') {
        return bookings.filter((booking) => !(booking.type === 'racket' && booking.status === 'RETURNED'));
      }
      return bookings.filter((booking) => booking.type === tabValue);
    },
    [bookings, tabValue],
  );
  const pendingBookings = useMemo(
    () => filteredBookings
      .filter((booking) => (booking.status === 'PENDING' && !hasBookingPassed(booking)) || booking.status === 'ACTIVE')
      .sort((a, b) => {
        if (a.date === null) return b.date === null ? 0 : 1;
        if (b.date === null) return -1;
        return a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? '');
      }),
    [filteredBookings],
  );
  const finishedBookings = useMemo(
    () => filteredBookings
      .filter((booking) => (
        (booking.status !== 'PENDING' && booking.status !== 'ACTIVE')
        || (booking.status === 'PENDING' && hasBookingPassed(booking))
      ))
      .sort((a, b) => {
        if (a.date === null) return b.date === null ? 0 : 1;
        if (b.date === null) return -1;
        return b.date.localeCompare(a.date) || (b.time ?? '').localeCompare(a.time ?? '');
      }),
    [filteredBookings],
  );
  const uniqueMaterialHistory = useMemo(() => {
    const materialHistory = finishedBookings.filter(
      (booking) => booking.type === 'racket' && booking.status === 'RETURNED',
    );
    return materialHistory.filter(
      (booking, index, history) => index === history.findIndex((item) => item.title === booking.title),
    );
  }, [finishedBookings]);
  const finishedNonMaterialBookings = useMemo(
    () => finishedBookings.filter((booking) => booking.type !== 'racket' || booking.status !== 'RETURNED'),
    [finishedBookings],
  );
  const filteredPendingBookings = pendingBookings;
  const filteredHistoryBookings = tabValue === 'racket' ? uniqueMaterialHistory : finishedNonMaterialBookings;

  const handleTabChange = (value: BookingTab) => {
    setTabValue(value);
    setPendingLimit(ITEMS_PER_PAGE);
    setHistoryLimit(ITEMS_PER_PAGE);
    if (value === 'racket') {
      setSearchParams({ tab: 'material' }, { replace: true });
    } else if (value === 'all') {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ tab: value }, { replace: true });
    }
  };

  const handleCancelBooking = async () => {
    if (!itemToActOn || isSubmitting || !user) return;
    setIsSubmitting(true);
    setCancelError(null);
    try {
      if (itemToActOn.type === 'racket') {
        const updatedUser = await racketService.returnRacket(user.id);
        const historyItems = bookingService.toRacketHistoryItems(updatedUser.racketHistory ?? []);
        setBookings((currentBookings) => [
          ...currentBookings.filter((booking) => booking.type !== 'racket'),
          ...historyItems,
        ]);
        setActionSuccess('Raqueta devuelta con éxito');
      } else {
        await bookingService.cancelBooking(itemToActOn.id, itemToActOn.type);
        setBookings((currentBookings) => currentBookings.map((booking) => (
          booking.id === itemToActOn.id ? { ...booking, status: 'CANCELLED' } : booking
        )));
        setActionSuccess('Reserva cancelada con éxito');
      }
      setItemToActOn(null);
    } catch {
      setCancelError(itemToActOn.type === 'racket'
        ? 'No se ha podido devolver la raqueta. Inténtalo de nuevo.'
        : 'No se ha podido cancelar la reserva. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const visiblePending = filteredPendingBookings.slice(0, pendingLimit);
  const visibleHistory = filteredHistoryBookings.slice(0, historyLimit);

  if (isAuthLoading || !isAuthenticated) {
    return (
      <Box role="status" aria-label="Cargando sesión" sx={{ minHeight: '55vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress color="error" />
      </Box>
    );
  }

  return (
    <Box component="section" sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, sm: 3, lg: 4 }, py: { xs: 4, sm: 6 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography component="p" sx={{ color: '#e60012', fontSize: 12, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          Tu actividad
        </Typography>
        <Typography component="h1" sx={{ mt: 0.75, color: 'white', fontSize: { xs: 30, sm: 36 }, fontWeight: 900, letterSpacing: '-0.025em' }}>
          Todas mis reservas
        </Typography>
        <Typography sx={{ mt: 1, color: '#c2c5cd' }}>
          Consulta tus partidos, entrenamientos y material alquilado.
        </Typography>
      </Box>

      <Paper elevation={2} sx={{ mb: 3, px: { xs: 1, sm: 2 }, borderRadius: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(_event, value: BookingTab) => handleTabChange(value)}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="Filtrar mis reservas"
          sx={{
            '& .MuiTab-root': { minHeight: 56, color: '#626875', fontWeight: 800, textTransform: 'none' },
            '& .Mui-selected': { color: '#e60012 !important' },
            '& .MuiTabs-indicator': { bgcolor: '#e60012', height: 3, borderRadius: 2 },
          }}
        >
          {tabs.map((tab) => <Tab key={tab.value} value={tab.value} label={tab.label} />)}
        </Tabs>
      </Paper>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3, borderRadius: 2 }}
          action={(
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                setIsLoading(true);
                setError(null);
                setReloadCount((count) => count + 1);
              }}
            >
              Reintentar
            </Button>
          )}
        >
          {error}
        </Alert>
      )}

      {isLoading && (
        <Box role="status" aria-label="Cargando reservas" sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress color="error" />
        </Box>
      )}

      {!isLoading && !error && filteredBookings.length === 0 && <EmptyState tab={tabValue} />}

      {!isLoading && !error && filteredBookings.length > 0 && (
        <Box>
          {pendingBookings.length > 0 && (
            <Box sx={{ mb: finishedBookings.length > 0 ? 5 : 0 }}>
              <Typography component="h2" variant="h5" sx={{ mb: 2, color: 'white', fontWeight: 900 }}>
                Reservas pendientes
              </Typography>
              <Grid container spacing={3}>
                {visiblePending.map((booking) => (
                  <Grid key={booking.id} size={{ xs: 12, md: 6 }}>
                    <BookingCard booking={booking} onAction={setItemToActOn} />
                  </Grid>
                ))}
              </Grid>
              {pendingLimit < filteredPendingBookings.length && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 4 }}>
                  <Button
                    variant="contained"
                    disableElevation
                    onClick={() => setPendingLimit((previousLimit) => previousLimit + ITEMS_PER_PAGE)}
                    sx={{ bgcolor: 'white', color: 'grey.900', fontWeight: 'bold', borderRadius: 2, textTransform: 'none', px: 4, py: 1, '&:hover': { bgcolor: 'grey.200' } }}
                  >
                    Más resultados
                  </Button>
                </Box>
              )}
            </Box>
          )}
          {filteredHistoryBookings.length > 0 && (
            <Box>
              <Typography component="h2" variant="h5" sx={{ mb: 2, color: 'white', fontWeight: 900 }}>
                {tabValue === 'racket' ? 'Palas usadas anteriormente' : 'Reservas terminadas'}
              </Typography>
              <Grid container spacing={3}>
                {visibleHistory.map((booking) => (
                  <Grid key={booking.id} size={{ xs: 12, md: 6 }}>
                    <BookingCard booking={booking} onAction={setItemToActOn} />
                  </Grid>
                ))}
              </Grid>
              {historyLimit < filteredHistoryBookings.length && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 4 }}>
                  <Button
                    variant="contained"
                    disableElevation
                    onClick={() => setHistoryLimit((previousLimit) => previousLimit + ITEMS_PER_PAGE)}
                    sx={{ bgcolor: 'white', color: 'grey.900', fontWeight: 'bold', borderRadius: 2, textTransform: 'none', px: 4, py: 1, '&:hover': { bgcolor: 'grey.200' } }}
                  >
                    Más resultados
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </Box>
      )}

      <Dialog
        open={itemToActOn !== null}
        onClose={() => {
          if (!isSubmitting) {
            setItemToActOn(null);
            setCancelError(null);
          }
        }}
        aria-labelledby="booking-action-title"
      >
        <DialogTitle id="booking-action-title">
          {itemToActOn?.type === 'racket' ? 'Devolver raqueta' : 'Cancelar reserva'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {itemToActOn?.type === 'racket'
              ? `¿Estás seguro de que quieres devolver la raqueta ${itemToActOn.title}?`
              : itemToActOn && `¿Estás seguro de que quieres cancelar esta reserva de ${itemToActOn.title}?`}
          </DialogContentText>
          {cancelError && <Alert severity="error" sx={{ mt: 2 }}>{cancelError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setItemToActOn(null);
              setCancelError(null);
            }}
            disabled={isSubmitting}
          >
            Volver
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => void handleCancelBooking()}
            disabled={isSubmitting}
            sx={{ borderRadius: 2 }}
          >
            {isSubmitting
              ? <CircularProgress size={22} color="inherit" />
              : itemToActOn?.type === 'racket' ? 'Confirmar devolución' : 'Confirmar cancelación'}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={actionSuccess !== null}
        autoHideDuration={4000}
        onClose={() => setActionSuccess(null)}
        message={actionSuccess}
      >
        <Alert severity="success" variant="filled" onClose={() => setActionSuccess(null)} sx={{ width: '100%' }}>
          {actionSuccess}
        </Alert>
      </Snackbar>
    </Box>
  );
}

function BookingCard({
  booking,
  onAction,
}: {
  booking: BookingItem;
  onAction: (booking: BookingItem) => void;
}) {
  const hasPassed = hasBookingPassed(booking);
  const canCancel = booking.type !== 'racket' && booking.status === 'PENDING' && !hasPassed;
  const canReturn = booking.type === 'racket' && booking.status === 'ACTIVE';
  const canAct = canCancel || canReturn;
  const statusLabel = booking.type === 'racket' && booking.status === 'RETURNED'
    ? 'Devuelta'
    : booking.status === 'CANCELLED'
      ? 'Cancelada'
      : booking.status === 'COMPLETED' || (hasPassed && booking.status !== 'CANCELLED')
        ? 'Completada'
        : null;

  return (
    <Card
      elevation={2}
      sx={{
        display: 'flex',
        flexDirection: 'row',
        height: 160,
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.14)',
        borderRadius: 3,
        bgcolor: 'white',
        transition: 'transform 220ms ease, box-shadow 220ms ease',
        '&:hover': { transform: 'scale(1.01)', boxShadow: '0 14px 32px rgba(0,0,0,0.24)' },
      }}
    >
      <CardMedia
        component="img"
        image={booking.image}
        alt=""
        sx={{ width: 140, height: '100%', flexShrink: 0, objectFit: 'cover' }}
        onError={(event) => {
          event.currentTarget.onerror = null;
          event.currentTarget.src = booking.type === 'court'
            ? '/images/padel-court-overhead.jpg'
            : booking.type === 'coach'
              ? '/images/coach-training.jpg'
              : '/images/racket-collection.jpg';
        }}
      />
      <CardContent
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'flex-start',
          gap: 0.75,
          minWidth: 0,
          overflow: 'hidden',
          p: 2,
          pt: 2,
          pb: 2,
          pr: canAct ? 16 : 2,
          '&:last-child': { pb: 2 },
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          sx={{ width: '100%', mb: 0.25, flexWrap: 'wrap', alignItems: 'center' }}
        >
          <Chip label={typeLabels[booking.type]} color={typeColors[booking.type]} size="small" sx={{ fontWeight: 800 }} />
          {statusLabel && (
            <Chip
              label={statusLabel}
              size="small"
              sx={{
                bgcolor: booking.status === 'CANCELLED' ? '#ffebee' : 'grey.200',
                color: booking.status === 'CANCELLED' ? 'error.main' : 'grey.800',
                fontWeight: 'bold',
                border: 'none',
              }}
            />
          )}
        </Stack>
        <Typography
          component="h3"
          variant="h6"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            pr: 0,
            color: '#17191e',
            fontWeight: 900,
            lineHeight: 1.25,
            minWidth: 0,
          }}
        >
          {booking.title}
        </Typography>
        {booking.date && (
          <Stack direction="row" spacing={1.5} sx={{ minWidth: 0, overflow: 'hidden', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#333844', minWidth: 0, overflow: 'hidden' }}>
              <CalendarMonthIcon fontSize="small" color="error" />
              <Typography variant="body2" noWrap sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{formatDate(booking.date)}</Typography>
            </Box>
            {booking.time && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#333844', flexShrink: 0 }}>
                <AccessTimeIcon fontSize="small" color="error" />
                <Typography variant="body2" sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{booking.time}</Typography>
              </Box>
            )}
          </Stack>
        )}
        {booking.type === 'racket' && (
          <Typography variant="body2" sx={{ color: '#626875', fontWeight: 700 }}>
            Alquiler actual · {booking.remainingUses ?? 0} usos restantes
          </Typography>
        )}
        {booking.price !== null && (
          <Typography variant="body2" sx={{ color: '#17191e', fontWeight: 900 }}>
            {booking.type === 'racket' ? `${booking.price} € - 3 Sesiones` : `€${booking.price}`}
          </Typography>
        )}
        {canAct && (
          <Button
            variant="contained"
            color="error"
            size="small"
            onClick={() => onAction(booking)}
            sx={{ position: 'absolute', top: 12, right: 12, zIndex: 1, borderRadius: 2, textTransform: 'none', fontWeight: 800 }}
          >
            {canReturn ? 'Devolver raqueta' : 'Cancelar reserva'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default MyBookingsPage;
