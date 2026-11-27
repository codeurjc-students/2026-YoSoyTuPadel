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
import {
    AccessTime as AccessTimeIcon,
    CalendarMonth as CalendarMonthIcon,
    EventBusy as EventBusyIcon,
} from '@mui/icons-material';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { racketService } from '../../rackets/services/racketService';
import { bookingService, type BookingItem, type BookingItemType } from '../services/bookingService';
import CourtMap from '../../courts/components/CourtMiniMap';

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
    if (!booking.date) return false;
    const today = new Date();
    const todayValue = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, '0'),
        String(today.getDate()).padStart(2, '0'),
    ].join('-');
    return booking.date < todayValue;
}

function EmptyState({ tab }: { tab: BookingTab }) {
    const isMaterial = tab === 'racket';
    const isAll = tab === 'all';

    return (
        <Paper
            elevation={0}
            sx={{
                px: 3,
                py: { xs: 5, sm: 7 },
                borderRadius: 4,
                textAlign: 'center',
                boxShadow: '0 12px 32px rgba(17, 19, 24, 0.08)',
            }}
        >
            <EventBusyIcon sx={{ color: '#e60012', fontSize: 56 }} />
            <Typography component="h2" variant="h5" sx={{ mt: 1.5, color: '#17191e', fontWeight: 900 }}>
                No tienes reservas en esta categoría
            </Typography>
            <Typography sx={{ mt: 1, color: '#626875' }}>
                Cuando tengas reservas o material alquilado, aparecerán aquí.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 1.5, mt: 3 }}>
                {(isAll || !isMaterial) && (
                    <Button
                        component={Link}
                        to="/courts"
                        variant="contained"
                        sx={{
                            borderRadius: 3,
                            bgcolor: '#e60012',
                            boxShadow: '0 8px 20px rgba(230,0,18,.22)',
                            '&:hover': { bgcolor: '#c4000f' },
                            fontWeight: 800,
                            textTransform: 'none',
                            px: 2.5,
                        }}
                    >
                        Explorar pistas
                    </Button>
                )}
                {(isAll || !isMaterial) && (
                    <Button
                        component={Link}
                        to="/coaches"
                        variant="outlined"
                        sx={{
                            borderRadius: 3,
                            borderColor: '#e60012',
                            color: '#e60012',
                            '&:hover': { borderColor: '#c4000f', bgcolor: 'rgba(230,0,18,0.04)' },
                            fontWeight: 800,
                            textTransform: 'none',
                            px: 2.5,
                        }}
                    >
                        Explorar entrenadores
                    </Button>
                )}
                {isMaterial && (
                    <Button
                        component={Link}
                        to="/rackets"
                        variant="contained"
                        sx={{
                            borderRadius: 3,
                            bgcolor: '#e60012',
                            boxShadow: '0 8px 20px rgba(230,0,18,.22)',
                            '&:hover': { bgcolor: '#c4000f' },
                            fontWeight: 800,
                            textTransform: 'none',
                            px: 2.5,
                        }}
                    >
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
            void navigate('/login', { replace: true, state: { from: '/bookings' } });
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
                const aDate = new Date(`${a.date}T${a.time ?? '00:00'}`).getTime();
                const bDate = new Date(`${b.date}T${b.time ?? '00:00'}`).getTime();
                return aDate - bDate;
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
                const aDate = new Date(`${a.date}T${a.time ?? '00:00'}`).getTime();
                const bDate = new Date(`${b.date}T${b.time ?? '00:00'}`).getTime();
                return bDate - aDate;
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

            <Paper
                elevation={0}
                sx={{
                    mb: 3,
                    px: { xs: 1, sm: 2 },
                    borderRadius: 4,
                    boxShadow: '0 12px 32px rgba(17, 19, 24, 0.08)',
                }}
            >
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
                                    <Grid key={booking.id} size={{ xs: 12, md: 6 }} sx={{ display: 'flex' }}>
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
                                        sx={{
                                            bgcolor: 'white',
                                            color: '#111318',
                                            fontWeight: 800,
                                            borderRadius: 3,
                                            textTransform: 'none',
                                            px: 4,
                                            py: 1,
                                            '&:hover': { bgcolor: 'grey.200' },
                                        }}
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
                                    <Grid key={booking.id} size={{ xs: 12, md: 6 }} sx={{ display: 'flex' }}>
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
                                        sx={{
                                            bgcolor: 'white',
                                            color: '#111318',
                                            fontWeight: 800,
                                            borderRadius: 3,
                                            textTransform: 'none',
                                            px: 4,
                                            py: 1,
                                            '&:hover': { bgcolor: 'grey.200' },
                                        }}
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
                fullWidth
                maxWidth="xs"
                slotProps={{
                    paper: {
                        sx: { borderRadius: 4, p: 0.5, m: { xs: 2, sm: 4 } },
                    },
                }}
            >
                <DialogTitle id="booking-action-title" sx={{ px: { xs: 2.5, sm: 3 }, pt: 2.5, pb: 1, fontWeight: 900 }}>
                    {itemToActOn?.type === 'racket' ? 'Devolver raqueta' : 'Cancelar reserva'}
                </DialogTitle>
                <DialogContent sx={{ px: { xs: 2.5, sm: 3 }, pb: 1.5 }}>
                    <DialogContentText sx={{ color: 'grey.700', lineHeight: 1.7 }}>
                        {itemToActOn?.type === 'racket'
                            ? `¿Estás seguro de que quieres devolver la raqueta ${itemToActOn.title}?`
                            : itemToActOn && `¿Estás seguro de que quieres cancelar esta reserva de ${itemToActOn.title}?`}
                    </DialogContentText>
                    {cancelError && <Alert severity="error" sx={{ mt: 2, borderRadius: 3 }}>{cancelError}</Alert>}
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
                        onClick={() => {
                            setItemToActOn(null);
                            setCancelError(null);
                        }}
                        disabled={isSubmitting}
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
                        onClick={() => void handleCancelBooking()}
                        disabled={isSubmitting}
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
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert severity="success" variant="filled" onClose={() => setActionSuccess(null)} sx={{ width: '100%' }}>
                    {actionSuccess}
                </Alert>
            </Snackbar>
        </Box>
    );
}

function hasCourtCoordinates(
    booking: BookingItem,
): booking is BookingItem & { latitude: number; longitude: number } {
    return booking.type === 'court'
        && typeof booking.latitude === 'number'
        && typeof booking.longitude === 'number'
        && Number.isFinite(booking.latitude)
        && Number.isFinite(booking.longitude);
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
            elevation={0}
            sx={{
                width: '100%',
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                height: { sm: 184 },
                position: 'relative',
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
            {hasCourtCoordinates(booking) ? (
                <Box sx={{ width: { xs: '100%', sm: 144 }, height: { xs: 150, sm: '100%' }, flexShrink: 0, overflow: 'hidden' }}>
                    <CourtMap
                        latitude={booking.latitude}
                        longitude={booking.longitude}
                        name={booking.title}
                        interactive={false}
                    />
                </Box>
            ) : (
                <CardMedia
                    component="img"
                    image={booking.image}
                    alt=""
                    sx={{
                        width: { xs: '100%', sm: 144 },
                        height: { xs: 160, sm: '100%' },
                        flexShrink: 0,
                        objectFit: booking.type === 'racket' ? 'contain' : 'cover',
                        objectPosition: booking.type === 'coach' ? 'center top' : 'center',
                        p: booking.type === 'racket' ? 1.5 : 0,
                        bgcolor: booking.type === 'racket' ? 'white' : '#f0f1f4',
                    }}
                    onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = booking.type === 'court'
                            ? '/images/padel-court-overhead.jpg'
                            : booking.type === 'coach'
                                ? '/images/coach-training.jpg'
                                : '/images/racket-collection.jpg';
                    }}
                />
            )}
            <CardContent
                sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 0.75,
                    minWidth: 0,
                    overflow: 'hidden',
                    p: 2,
                    '&:last-child': { pb: 2 },
                }}
            >
                <Box sx={{ width: '100%', minWidth: 0 }}>
                    <Stack
                        direction="row"
                        spacing={1}
                        sx={{ width: '100%', mb: 0.75, flexWrap: 'wrap', alignItems: 'center', gap: 0.5 }}
                    >
                        <Chip label={typeLabels[booking.type]} color={typeColors[booking.type]} size="small" sx={{ fontWeight: 800 }} />
                        {statusLabel && (
                            <Chip
                                label={statusLabel}
                                size="small"
                                sx={{
                                    bgcolor: booking.status === 'CANCELLED' ? '#ffebee' : 'grey.200',
                                    color: booking.status === 'CANCELLED' ? 'error.main' : 'grey.800',
                                    fontWeight: 700,
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
                            wordBreak: 'break-word',
                            whiteSpace: 'normal',
                            color: '#17191e',
                            fontWeight: 900,
                            lineHeight: 1.25,
                            minWidth: 0,
                        }}
                    >
                        {booking.title}
                    </Typography>
                </Box>

                <Stack spacing={0.5} sx={{ width: '100%', minWidth: 0 }}>
                    {booking.date && (
                        <Box
                            sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                alignItems: 'center',
                                columnGap: 1.5,
                                rowGap: 0.25,
                                minWidth: 0,
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#333844', minWidth: 0 }}>
                                <CalendarMonthIcon fontSize="small" color="error" />
                                <Typography variant="body2" sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>
                                    {formatDate(booking.date)}
                                </Typography>
                            </Box>
                            {booking.time && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#333844', flexShrink: 0 }}>
                                    <AccessTimeIcon fontSize="small" color="error" />
                                    <Typography variant="body2" sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>
                                        {booking.time}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    )}
                    {booking.type === 'racket' && (
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem', fontWeight: 700 }}>
                            Alquiler actual · {booking.remainingUses ?? 0} usos restantes
                        </Typography>
                    )}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 1,
                            pt: canAct ? 0.5 : 0,
                            flexWrap: 'wrap',
                        }}
                    >
                        {booking.price !== null ? (
                            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem', fontWeight: 900 }}>
                                {booking.type === 'racket' ? `${booking.price} € - 3 Sesiones` : `€${booking.price}`}
                            </Typography>
                        ) : <span />}
                        {canAct && (
                            <Button
                                variant="contained"
                                size="small"
                                onClick={() => onAction(booking)}
                                sx={{
                                    borderRadius: 3,
                                    bgcolor: '#e60012',
                                    boxShadow: 'none',
                                    '&:hover': { bgcolor: '#c4000f', boxShadow: 'none' },
                                    textTransform: 'none',
                                    fontWeight: 800,
                                    px: 1.75,
                                }}
                            >
                                {canReturn ? 'Devolver raqueta' : 'Cancelar reserva'}
                            </Button>
                        )}
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
}

export default MyBookingsPage;