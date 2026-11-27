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
  MenuItem,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import {
  DeleteOutlineRounded as DeleteOutlineRoundedIcon,
  EditOutlined as EditOutlinedIcon,
  EventAvailableRounded as EventAvailableRoundedIcon,
  PersonOutlineRounded as PersonOutlineRoundedIcon,
} from '@mui/icons-material';
import api from '../../../service/api';
import { authService, type AuthUser } from '../../auth/services/authService';
import { coachService } from '../../coaches/services/coachService';
import CreateCoachDialog from '../components/CreateCoachDialog';
import { courtService } from '../../courts/services/courtService';
import toast from 'react-hot-toast';

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
  skillLevel: number | null;
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
  | { kind: 'delete-user-image'; user: AdminUser }
  | { kind: 'cancel-booking'; booking: AdminBooking }
  | { kind: 'delete-user'; user: AdminUser }
  | { kind: 'delete-booking'; booking: AdminBooking };

const cardSx = {
  borderRadius: 4,
  border: '1px solid #e8e8eb',
  bgcolor: 'white',
  color: 'grey.900',
  boxShadow: '0 12px 32px rgba(17, 19, 24, 0.08)',
  transition: 'transform 300ms ease, box-shadow 300ms ease',
  '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 16px 36px rgba(17, 19, 24, 0.14)' },
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
    skillLevel: user.skillLevel ?? null,
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
    <Card elevation={0} sx={cardSx}>
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
                sx={{ bgcolor: '#e60012', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', height: 26, borderRadius: 1.5, color: 'white' }}
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
                sx={{ borderColor: 'grey.800', color: 'grey.900', borderWidth: 2, fontWeight: 'bold', textTransform: 'none', borderRadius: 3, '&:hover': { borderWidth: 2, bgcolor: 'grey.100' } }}
              >
                Cancelar
              </Button>
            ) : null}
            <Button fullWidth variant="contained" onClick={onDelete} sx={{ bgcolor: '#e60012', '&:hover': { bgcolor: '#c4000f' }, fontWeight: 800, textTransform: 'none', borderRadius: 3 }}>
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
  const [visibleUsersCount, setVisibleUsersCount] = useState(10);
  const [visibleCoachesCount, setVisibleCoachesCount] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [originalEditingUser, setOriginalEditingUser] = useState<AdminUser | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isCreateCoachOpen, setIsCreateCoachOpen] = useState(false);
  const [imageVersions, setImageVersions] = useState<Record<number, number>>({});
  const hasChanges = Boolean(editingUser && originalEditingUser && (
    editingUser.name !== originalEditingUser.name
    || editingUser.nickname !== originalEditingUser.nickname
    || editingUser.email !== originalEditingUser.email
    || editingUser.sessionPrice !== originalEditingUser.sessionPrice
    || editingUser.skillLevel !== originalEditingUser.skillLevel
  ));

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

  const visibleUsers = useMemo(() => users.filter((user) => user.role === 'USER'), [users]);
  const visibleCoaches = useMemo(() => users.filter((user) => user.role === 'COACH'), [users]);
  const pendingBookings = useMemo(() => bookings.filter(isPendingBooking), [bookings]);
  const completedBookings = useMemo(() => bookings.filter((booking) => !isPendingBooking(booking)), [bookings]);
  const visiblePendingBookings = pendingBookings.slice(0, visibleBookings);
  const visibleCompletedBookings = completedBookings.slice(0, visibleBookings);
  const handleLoadMore = () => setVisibleBookings((previous) => previous + 10);
  const handleCoachCreated = (coach: AuthUser) => {
    setUsers((current) => [...current, {
      id: coach.id,
      name: coach.name ?? coach.nickname ?? 'Entrenador sin nombre',
      nickname: coach.nickname,
      email: coach.email,
      role: 'COACH',
      sessionPrice: coach.sessionPrice ?? null,
      skillLevel: coach.skillLevel ?? null,
    }]);
  };

  const handleDeleteUserImage = async (user: AdminUser) => {
    try {
      await authService.deleteUserImage(user.id);
      setImageVersions((current) => ({ ...current, [user.id]: (current[user.id] ?? 0) + 1 }));
      toast.success('Foto eliminada correctamente.');
    } catch (error: unknown) {
      toast.error(authService.getErrorMessage(error));
    }
  };

  const confirmAction = async () => {
    if (!confirmation) return;
    try {
      if (confirmation.kind === 'save-user') {
        await authService.updateUser(confirmation.user.id, {
          name: confirmation.user.name.trim(),
          email: confirmation.user.email.trim(),
          sessionPrice: confirmation.user.sessionPrice,
          ...(confirmation.user.role === 'USER' && confirmation.user.nickname
            ? { nickname: confirmation.user.nickname.trim() }
            : {}),
          ...(confirmation.user.role === 'COACH' && confirmation.user.skillLevel !== null
            ? { skillLevel: confirmation.user.skillLevel }
            : {}),
        });
        setUsers((current) => current.map((user) => user.id === confirmation.user.id ? confirmation.user : user));
        setEditingUser(null);
        setOriginalEditingUser(null);
        setSuccessMessage('Usuario modificado con éxito.');
      } else if (confirmation.kind === 'delete-user-image') {
        await handleDeleteUserImage(confirmation.user);
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
              <Tabs value={userFilter} onChange={(_, value: UserFilter) => setUserFilter(value)} sx={{ '& .MuiTab-root': { color: 'grey.400', fontWeight: 700, textTransform: 'none' }, '& .Mui-selected': { color: '#fff' }, '& .MuiTabs-indicator': { bgcolor: '#e60012' } }}>
                <Tab value="clients" label={`Clientes (${users.filter((user) => user.role === 'USER').length})`} />
                <Tab value="coaches" label={`Entrenadores (${users.filter((user) => user.role === 'COACH').length})`} />
              </Tabs>
              {userFilter === 'coaches' && (
                <Button
                  variant="contained"
                  onClick={() => setIsCreateCoachOpen(true)}
                  sx={{ bgcolor: '#e60012', boxShadow: '0 8px 20px rgba(230,0,18,.22)', '&:hover': { bgcolor: '#c4000f' }, fontWeight: 900, textTransform: 'uppercase', borderRadius: 3 }}
                >
                    AÑADIR ENTRENADOR
                </Button>
              )}
              </Box>
              <Stack spacing={2}>
                {(userFilter === 'clients' ? visibleUsers.slice(0, visibleUsersCount) : visibleCoaches.slice(0, visibleCoachesCount)).map((user) => (
                    <Card key={user.id} elevation={0} sx={{ ...cardSx, display: 'flex', flexDirection: { xs: 'column', sm: 'row' } }}>
                    <Box sx={{ p: 2.5, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <Avatar src={`/api/v1/users/${user.id}/image?v=${imageVersions[user.id] ?? 0}`} alt={user.name} sx={{ width: 100, height: 100, objectFit: 'cover', bgcolor: '#e60012', fontWeight: 900, fontSize: 28 }}>
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
                      <Button fullWidth variant="outlined" startIcon={<EditOutlinedIcon />} onClick={() => { setEditingUser({ ...user }); setOriginalEditingUser({ ...user }); }} sx={{ borderColor: 'grey.800', color: 'grey.900', borderWidth: 2, fontWeight: 'bold', textTransform: 'none', borderRadius: 3, '&:hover': { borderWidth: 2, bgcolor: 'grey.100' } }}>Modificar</Button>
                      <Button fullWidth variant="contained" startIcon={<DeleteOutlineRoundedIcon />} onClick={() => setConfirmation({ kind: 'delete-user', user })} sx={{ bgcolor: '#e60012', '&:hover': { bgcolor: '#c4000f' }, fontWeight: 800, textTransform: 'none', borderRadius: 3 }}>Eliminar</Button>
                    </Stack>
                  </Card>
                ))}
              </Stack>
              {userFilter === 'clients' && visibleUsers.length > visibleUsersCount && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <Button
                        variant="outlined"
                        onClick={() => setVisibleUsersCount((count) => count + 10)}
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
                    VER MÁS
                  </Button>
                </Box>
              )}
              {userFilter === 'coaches' && (
                <>
                  {visibleCoaches.length > visibleCoachesCount && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <Button
                            variant="outlined"
                            onClick={() => setVisibleCoachesCount((count) => count + 10)}
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
                        VER MÁS
                      </Button>
                    </Box>
                  )}
                </>
              )}
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
                          sx={{ bgcolor: 'white', color: 'grey.900', fontWeight: 'bold', borderRadius: 3, textTransform: 'none', px: 4, py: 1, '&:hover': { bgcolor: 'grey.200' } }}
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

      <Dialog open={editingUser !== null} onClose={() => { setEditingUser(null); setOriginalEditingUser(null); }} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { bgcolor: 'white', borderRadius: 3 } } }}>
        <DialogTitle sx={{ px: { xs: 2.5, sm: 3 }, pt: 2.5, pb: 1, color: 'grey.900', fontWeight: 900 }}>Modificar usuario</DialogTitle>
        <DialogContent sx={{ px: { xs: 2.5, sm: 3 }, pb: 1.5 }}>
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
              <>
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
                <TextField
                  select
                  required
                  label="Nivel de certificación"
                  value={editingUser.skillLevel ?? ''}
                  onChange={(event) => setEditingUser((current) => current
                    ? { ...current, skillLevel: Number(event.target.value) }
                    : current)}
                  fullWidth
                >
                  {[1, 2, 3].map((level) => (
                    <MenuItem key={level} value={level}>Nivel {level}</MenuItem>
                  ))}
                </TextField>
              </>
            )}
            <TextField label="Email" type="email" value={editingUser?.email ?? ''} onChange={(event) => setEditingUser((current) => current ? { ...current, email: event.target.value } : current)} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2.5, sm: 3 }, pb: 2.5, pt: 1, gap: 1.25, flexDirection: { xs: 'column-reverse', sm: 'row' }, '& > :not(style) ~ :not(style)': { ml: { xs: 0, sm: 1.25 } } }}>
          <Button onClick={() => setEditingUser(null)} variant="outlined" color="inherit" sx={{ width: { xs: '100%', sm: 'auto' }, borderRadius: 3, borderColor: 'grey.300', color: 'grey.800', textTransform: 'none', fontWeight: 700, px: 2.5, py: 0.9 }}>Volver</Button>
          <Button
            variant="outlined"
            color="error"
            onClick={() => editingUser && setConfirmation({ kind: 'delete-user-image', user: editingUser })}
            sx={{ width: { xs: '100%', sm: 'auto' }, borderRadius: 3, fontWeight: 800, px: 2.5, py: 0.9 }}
          >
            ELIMINAR FOTO
          </Button>
          <Button variant="contained" disabled={!hasChanges || !editingUser?.name.trim() || !editingUser?.email.trim()} onClick={() => editingUser && setConfirmation({ kind: 'save-user', user: editingUser })} sx={{ width: { xs: '100%', sm: 'auto' }, borderRadius: 3, bgcolor: '#e60012', boxShadow: '0 8px 20px rgba(230,0,18,.22)', '&:hover': { bgcolor: '#c4000f' }, fontWeight: 800, textTransform: 'none', px: 2.5, py: 0.9 }}>Guardar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmation !== null} onClose={() => setConfirmation(null)} fullWidth maxWidth="xs" slotProps={{ paper: { sx: { bgcolor: 'white', borderRadius: 4, p: 0.5, m: { xs: 2, sm: 4 } } } }}>
        <DialogTitle sx={{ px: { xs: 2.5, sm: 3 }, pt: 2.5, pb: 1, color: 'grey.900', fontWeight: 900 }}>¿Estás seguro?</DialogTitle>
        <DialogContent sx={{ px: { xs: 2.5, sm: 3 }, pb: 1.5 }}>
          <DialogContentText sx={{ color: 'grey.700' }}>
            {confirmation?.kind === 'save-user' && 'Se guardarán los cambios del usuario.'}
            {confirmation?.kind === 'delete-user-image' && 'Se eliminará la foto de perfil del usuario.'}
            {confirmation?.kind === 'cancel-booking' && 'La reserva quedará cancelada.'}
            {(confirmation?.kind === 'delete-user' || confirmation?.kind === 'delete-booking') && 'Esta acción no se puede deshacer.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2.5, sm: 3 }, pb: 2.5, pt: 1, gap: 1.25, flexDirection: { xs: 'column-reverse', sm: 'row' }, '& > :not(style) ~ :not(style)': { ml: { xs: 0, sm: 1.25 } } }}>
          <Button onClick={() => setConfirmation(null)} variant="outlined" color="inherit" sx={{ width: { xs: '100%', sm: 'auto' }, borderRadius: 3, borderColor: 'grey.300', color: 'grey.800', textTransform: 'none', fontWeight: 700, px: 2.5, py: 0.9 }}>Volver</Button>
          <Button variant="contained" onClick={() => void confirmAction()} sx={{ width: { xs: '100%', sm: 'auto' }, borderRadius: 3, bgcolor: '#e60012', boxShadow: '0 8px 20px rgba(230,0,18,.22)', '&:hover': { bgcolor: '#c4000f' }, fontWeight: 800, textTransform: 'none', px: 2.5, py: 0.9 }}>Confirmar</Button>
        </DialogActions>
      </Dialog>

      <CreateCoachDialog
        open={isCreateCoachOpen}
        onClose={() => setIsCreateCoachOpen(false)}
        onCreated={handleCoachCreated}
      />

      <Snackbar open={successMessage !== null} autoHideDuration={4000} onClose={() => setSuccessMessage(null)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity="success" variant="filled" onClose={() => setSuccessMessage(null)} sx={{ width: '100%' }}>{successMessage}</Alert>
      </Snackbar>
    </Box>
  );
}

export default AdminDashboardPage;
