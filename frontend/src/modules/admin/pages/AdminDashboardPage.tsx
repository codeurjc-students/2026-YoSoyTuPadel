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
  Divider,
  InputAdornment,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import api from '../../../service/api';
import { authService, type AuthUser } from '../../auth/services/authService';
import { coachService } from '../../coaches/services/coachService';
import { courtService } from '../../courts/services/courtService';

type MainTab = 'users' | 'bookings';
type UserFilter = 'clients' | 'coaches';
type UserRole = 'USER' | 'COACH' | 'ADMIN';

interface AdminUser {
  id: number;
  name: string;
  nickname: string | null;
  email: string;
  role: UserRole;
  sessionPrice: number | null;
}

interface BookingDTO {
  id: number;
  bookingDate: string;
  startTime: string;
  endTime: string;
  bookingPrice: number | null;
  type: 'MATCH' | 'TRAINING';
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  userId: number;
  courtId: number | null;
  coachId: number | null;
}

interface AdminBooking extends BookingDTO {
  user: AdminUser | null;
  resourceName: string;
  image: string;
}

type Confirmation =
  | { kind: 'save-user'; user: AdminUser }
  | { kind: 'cancel-booking'; booking: AdminBooking }
  | { kind: 'delete-user'; user: AdminUser }
  | { kind: 'delete-booking'; booking: AdminBooking };

const cardSx = {
  borderRadius: 4,
  bgcolor: 'white',
  color: 'grey.900',
  boxShadow: '0 16px 35px rgba(0,0,0,0.12)',
};

function normalizeRole(role: string): UserRole {
  const normalized = role.toUpperCase().replace(/^ROLE_/, '');
  return normalized === 'COACH' || normalized === 'ADMIN' ? normalized : 'USER';
}

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

function isPendingBooking(booking: AdminBooking) {
  const [year, month, day] = booking.bookingDate.split('-').map(Number);
  const [hour, minute] = booking.startTime.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute).getTime() >= Date.now()
    && booking.status !== 'CANCELLED';
}

async function fetchUsers(signal?: AbortSignal): Promise<AdminUser[]> {
  const { data } = await api.get<Array<AuthUser & { nickname?: string | null }>>('/api/v1/users', { signal });
  return data.map((user) => ({
    id: user.id,
    name: user.name ?? user.nickname ?? 'Usuario sin nombre',
    nickname: user.nickname,
    email: user.email,
    role: normalizeRole(user.role),
    sessionPrice: user.sessionPrice ?? null,
  }));
}

async function fetchBookings(signal?: AbortSignal): Promise<AdminBooking[]> {
  const { data } = await api.get<BookingDTO[]>('/api/v1/bookings', { signal });
  const users = await fetchUsers(signal);
  const usersById = new Map(users.map((user) => [user.id, user]));

  return Promise.all(data.map(async (booking) => {
    if (booking.type === 'TRAINING' && booking.coachId !== null) {
      const coach = await coachService.getCoachById(booking.coachId, signal);
      return {
        ...booking,
        user: usersById.get(booking.userId) ?? null,
        resourceName: coach.name,
        image: coachService.getCoachImageUrl(booking.coachId),
      };
    }

    if (booking.courtId !== null) {
      const court = await courtService.getCourtById(booking.courtId, signal);
      return {
        ...booking,
        user: usersById.get(booking.userId) ?? null,
        resourceName: court.name,
        image: '/images/padel-court-overhead.jpg',
      };
    }

    return {
      ...booking,
      user: usersById.get(booking.userId) ?? null,
      resourceName: 'Reserva',
      image: '/images/padel-court-overhead.jpg',
    };
  }));
}

function BookingCard({
  booking,
  onCancel,
  onDelete,
}: {
  booking: AdminBooking;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const userName = booking.user?.name || booking.user?.nickname || 'Usuario desconocido';
  const canCancel = isPendingBooking(booking);
  const finalStatus = booking.status === 'CANCELLED' ? 'Cancelada' : 'Terminada';

  return (
    <Card
      elevation={3}
      sx={{
        ...cardSx,
        mb: 3,
        transition: 'transform 0.2s',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: 6 },
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 2.5 }, '&:last-child': { pb: { xs: 2, sm: 2.5 } } }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} sx={{ alignItems: { xs: 'stretch', md: 'center' } }}>
          <Box
            component="img"
            src={booking.image}
            alt={booking.resourceName}
            sx={{ width: { xs: '100%', md: 140 }, height: 110, objectFit: 'cover', objectPosition: 'top', borderRadius: 3, bgcolor: 'grey.100' }}
          />
          <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <Chip
                variant="filled"
                color="error"
                label={booking.type === 'MATCH' ? 'Partido' : 'Entrenamiento'}
                size="small"
                sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', height: 26, borderRadius: 1.5, color: 'white' }}
              />
            </Stack>
            <Typography sx={{ color: 'grey.900', fontSize: '1.2rem', fontWeight: 900 }}>
              {booking.type === 'TRAINING' ? 'Entrenador' : 'Pista'}: {booking.resourceName}
            </Typography>
            <Typography sx={{ color: 'grey.900', fontWeight: 700 }}>Usuario: {userName}</Typography>
            <Typography sx={{ color: 'grey.800', fontWeight: 600 }}>
              {formatDate(booking.bookingDate)} · {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
            </Typography>
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center', pt: 0.5 }}>
              {booking.bookingPrice !== null && (
                <Typography sx={{ color: 'grey.900', fontSize: '1.05rem', fontWeight: 900 }}>
                  {booking.bookingPrice.toFixed(2)} €
                </Typography>
              )}
              {!canCancel && (
                <Chip
                  size="small"
                  color={booking.status === 'CANCELLED' ? 'error' : 'success'}
                  label={finalStatus}
                  sx={{ fontWeight: 800 }}
                />
              )}
            </Stack>
          </Stack>
          <Stack direction={{ xs: 'row', md: 'column' }} spacing={1.2} sx={{ minWidth: { md: 145 } }}>
            {canCancel ? (
              <Button
                fullWidth
                variant="outlined"
                onClick={onCancel}
                sx={{ borderColor: 'grey.800', color: 'grey.900', borderWidth: 2, fontWeight: 'bold', textTransform: 'none', borderRadius: 2, '&:hover': { borderWidth: 2, bgcolor: 'grey.100' } }}
              >
                Cancelar
              </Button>
            ) : null}
            <Button fullWidth variant="contained" color="error" onClick={onDelete} sx={{ fontWeight: 800, textTransform: 'none', borderRadius: 2 }}>
              Eliminar
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

function AdminDashboardPage() {
  const [mainTab, setMainTab] = useState<MainTab>('users');
  const [userFilter, setUserFilter] = useState<UserFilter>('clients');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [visibleBookings, setVisibleBookings] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.all([fetchUsers(controller.signal), fetchBookings(controller.signal)])
      .then(([loadedUsers, loadedBookings]) => {
        setUsers(loadedUsers);
        setBookings(loadedBookings);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setLoadError(authService.getErrorMessage(error));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, []);

  const visibleUsers = useMemo(
    () => users.filter((user) => user.role === (userFilter === 'clients' ? 'USER' : 'COACH')),
    [userFilter, users],
  );
  const pendingBookings = useMemo(() => bookings.filter(isPendingBooking), [bookings]);
  const completedBookings = useMemo(() => bookings.filter((booking) => !isPendingBooking(booking)), [bookings]);
  const visiblePendingBookings = pendingBookings.slice(0, visibleBookings);
  const visibleCompletedBookings = completedBookings.slice(0, visibleBookings);
  const handleLoadMore = () => setVisibleBookings((previous) => previous + 10);

  const confirmAction = async () => {
    if (!confirmation) return;
    try {
      if (confirmation.kind === 'save-user') {
        await authService.updateUser(confirmation.user.id, {
          name: confirmation.user.name.trim(),
          nickname: confirmation.user.nickname ?? '',
          email: confirmation.user.email.trim(),
          sessionPrice: confirmation.user.sessionPrice,
        });
        setUsers((current) => current.map((user) => user.id === confirmation.user.id ? confirmation.user : user));
        setEditingUser(null);
        setSuccessMessage('Usuario modificado con éxito.');
      } else if (confirmation.kind === 'cancel-booking') {
        await api.patch(`/api/v1/bookings/${confirmation.booking.id}`);
        setBookings((current) => current.map((booking) => booking.id === confirmation.booking.id ? { ...booking, status: 'CANCELLED' } : booking));
        setSuccessMessage('Reserva cancelada con éxito.');
      } else if (confirmation.kind === 'delete-user') {
        await api.delete(`/api/v1/users/${confirmation.user.id}`);
        setUsers((current) => current.filter((user) => user.id !== confirmation.user.id));
        setSuccessMessage('Usuario eliminado con éxito.');
      } else {
        await api.delete(`/api/v1/bookings/${confirmation.booking.id}`);
        setBookings((current) => current.filter((booking) => booking.id !== confirmation.booking.id));
        setSuccessMessage('Reserva eliminada con éxito.');
      }
      setConfirmation(null);
    } catch (error: unknown) {
      setLoadError(authService.getErrorMessage(error));
    }
  };

  return (
    <Box component="section" sx={{ maxWidth: 1220, mx: 'auto', px: { xs: 2, sm: 3, lg: 4 }, py: { xs: 4, sm: 7 } }}>
      <Typography component="h1" align="center" sx={{ color: 'white', fontSize: { xs: 24, sm: 30 }, fontWeight: 900, letterSpacing: '0.16em', mb: 4 }}>
        PANEL DE ADMINISTRACIÓN
      </Typography>

      {isLoading && <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}><CircularProgress color="error" /></Box>}
      {!isLoading && loadError && <Alert severity="error" sx={{ mb: 3 }}>{loadError}</Alert>}
      {!isLoading && !loadError && (
        <>
          <Box sx={{ borderBottom: '1px solid rgba(255,255,255,0.12)', mb: 4 }}>
            <Tabs value={mainTab} onChange={(_, value: MainTab) => setMainTab(value)} centered textColor="inherit" sx={{ '& .MuiTabs-indicator': { bgcolor: '#e60012', height: 3 }, '& .MuiTab-root': { color: 'grey.400', fontWeight: 800, textTransform: 'none', minWidth: 150 }, '& .Mui-selected': { color: 'white' } }}>
              <Tab value="users" label="Usuarios" icon={<PersonOutlineRoundedIcon />} iconPosition="start" />
              <Tab value="bookings" label="Reservas" icon={<EventAvailableRoundedIcon />} iconPosition="start" />
            </Tabs>
          </Box>

          {mainTab === 'users' ? (
            <>
              <Tabs value={userFilter} onChange={(_, value: UserFilter) => setUserFilter(value)} sx={{ mb: 3, '& .MuiTab-root': { color: 'grey.400', fontWeight: 700, textTransform: 'none' }, '& .Mui-selected': { color: '#fff' }, '& .MuiTabs-indicator': { bgcolor: '#e60012' } }}>
                <Tab value="clients" label={`Clientes (${users.filter((user) => user.role === 'USER').length})`} />
                <Tab value="coaches" label={`Entrenadores (${users.filter((user) => user.role === 'COACH').length})`} />
              </Tabs>
              <Stack spacing={2}>
                {visibleUsers.map((user) => (
                  <Card key={user.id} sx={{ ...cardSx, display: 'flex', flexDirection: { xs: 'column', sm: 'row' } }}>
                    <Box sx={{ p: 2.5, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <Avatar src={`/api/v1/users/${user.id}/image`} alt={user.name} sx={{ width: 100, height: 100, objectFit: 'cover', bgcolor: '#e60012', fontWeight: 900, fontSize: 28 }}>
                        {initials(user.name)}
                      </Avatar>
                    </Box>
                    <CardContent sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', p: 2.5, '&:last-child': { pb: 2.5 } }}>
                      <Typography sx={{ fontSize: 18, fontWeight: 900, overflowWrap: 'anywhere' }}>{user.name}</Typography>
                      <Typography sx={{ mt: 0.5, color: 'grey.600', overflowWrap: 'anywhere' }}>{user.email}</Typography>
                      <Chip label={user.role === 'COACH' ? 'Entrenador' : user.role === 'ADMIN' ? 'Administrador' : 'Cliente'} size="small" sx={{ mt: 1.5, alignSelf: 'flex-start', bgcolor: '#fbe5e7', color: '#b0000d', fontWeight: 800 }} />
                    </CardContent>
                    <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
                    <Stack direction={{ xs: 'row', sm: 'column' }} spacing={1.2} sx={{ p: 2.5, justifyContent: 'center', minWidth: { sm: 165 } }}>
                      <Button fullWidth variant="outlined" startIcon={<EditOutlinedIcon />} onClick={() => setEditingUser({ ...user })} sx={{ borderColor: 'grey.800', color: 'grey.900', borderWidth: 2, fontWeight: 'bold', textTransform: 'none', borderRadius: 2, '&:hover': { borderWidth: 2, bgcolor: 'grey.100' } }}>Modificar</Button>
                      <Button fullWidth variant="contained" color="error" startIcon={<DeleteOutlineRoundedIcon />} onClick={() => setConfirmation({ kind: 'delete-user', user })} sx={{ fontWeight: 800, textTransform: 'none', borderRadius: 2 }}>Eliminar</Button>
                    </Stack>
                  </Card>
                ))}
              </Stack>
            </>
          ) : (
            <Stack spacing={4}>
              {[
                { title: 'Reservas pendientes', items: visiblePendingBookings, total: pendingBookings.length },
                { title: 'Reservas completadas', items: visibleCompletedBookings, total: completedBookings.length },
              ].map(({ title, items, total }) => (
                <Box key={title}>
                  <Typography sx={{ color: 'white', fontSize: 20, fontWeight: 900, mb: 2 }}>{title}</Typography>
                  <Stack spacing={2}>
                    {items.map((booking) => (
                      <BookingCard
                        key={booking.id}
                        booking={booking}
                        onCancel={() => setConfirmation({ kind: 'cancel-booking', booking })}
                        onDelete={() => setConfirmation({ kind: 'delete-booking', booking })}
                      />
                    ))}
                    {items.length === 0 && <Typography sx={{ color: 'grey.400' }}>No hay reservas en esta sección.</Typography>}
                    {visibleBookings < total && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 4 }}>
                        <Button
                          variant="contained"
                          disableElevation
                          onClick={handleLoadMore}
                          sx={{ bgcolor: 'white', color: 'grey.900', fontWeight: 'bold', borderRadius: 2, textTransform: 'none', px: 4, py: 1, '&:hover': { bgcolor: 'grey.200' } }}
                        >
                          Más resultados
                        </Button>
                      </Box>
                    )}
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </>
      )}

      <Dialog open={editingUser !== null} onClose={() => setEditingUser(null)} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { bgcolor: 'white', borderRadius: 3 } } }}>
        <DialogTitle sx={{ color: 'grey.900', fontWeight: 900 }}>Modificar usuario</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Nombre" value={editingUser?.name ?? ''} onChange={(event) => setEditingUser((current) => current ? { ...current, name: event.target.value } : current)} fullWidth />
            {editingUser?.role === 'USER' && (
              <TextField
                label="Nickname"
                value={editingUser.nickname ?? ''}
                onChange={(event) => setEditingUser((current) => current ? { ...current, nickname: event.target.value } : current)}
                fullWidth
              />
            )}
            {editingUser?.role === 'COACH' && (
              <TextField
                label="Precio por sesión"
                type="number"
                value={editingUser.sessionPrice ?? ''}
                onChange={(event) => setEditingUser((current) => {
                  if (!current) return current;
                  const value = event.target.value;
                  return { ...current, sessionPrice: value === '' ? null : Number(value) };
                })}
                slotProps={{
                  input: { startAdornment: <InputAdornment position="start">€</InputAdornment> },
                  htmlInput: { min: 0, step: 0.01 },
                }}
                fullWidth
              />
            )}
            <TextField label="Email" type="email" value={editingUser?.email ?? ''} onChange={(event) => setEditingUser((current) => current ? { ...current, email: event.target.value } : current)} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditingUser(null)} sx={{ color: 'grey.700', textTransform: 'none' }}>Volver</Button>
          <Button variant="contained" color="error" disabled={!editingUser?.name.trim() || !editingUser?.email.trim()} onClick={() => editingUser && setConfirmation({ kind: 'save-user', user: editingUser })} sx={{ fontWeight: 800, textTransform: 'none' }}>Guardar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmation !== null} onClose={() => setConfirmation(null)} fullWidth maxWidth="xs" slotProps={{ paper: { sx: { bgcolor: 'white', borderRadius: 3 } } }}>
        <DialogTitle sx={{ color: 'grey.900', fontWeight: 900 }}>¿Estás seguro?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'grey.700' }}>
            {confirmation?.kind === 'save-user' && 'Se guardarán los cambios del usuario.'}
            {confirmation?.kind === 'cancel-booking' && 'La reserva quedará cancelada.'}
            {(confirmation?.kind === 'delete-user' || confirmation?.kind === 'delete-booking') && 'Esta acción no se puede deshacer.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConfirmation(null)} sx={{ color: 'grey.700', textTransform: 'none' }}>Volver</Button>
          <Button variant="contained" color="error" onClick={() => void confirmAction()} sx={{ fontWeight: 800, textTransform: 'none' }}>Confirmar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={successMessage !== null} autoHideDuration={4000} onClose={() => setSuccessMessage(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" variant="filled" onClose={() => setSuccessMessage(null)} sx={{ width: '100%' }}>{successMessage}</Alert>
      </Snackbar>
    </Box>
  );
}

export default AdminDashboardPage;
