import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
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
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../auth/hooks/useAuth';
import { authService, type AuthUser, type UserUpdateDetails } from '../../auth/services/authService';
import { racketService, type RacketDTO } from '../../rackets/services/racketService';

const cardSx = {
  borderRadius: 4,
  bgcolor: 'white',
  color: 'grey.900',
  mb: 3,
  p: 2,
};

function UserProfilePage() {
  const { user: authenticatedUser, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<AuthUser | null>(authenticatedUser);
  const [loadedRacket, setLoadedRacket] = useState<RacketDTO>();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isConfirmEditOpen, setIsConfirmEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isPhotoConfirmOpen, setIsPhotoConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imageVersion, setImageVersion] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [form, setForm] = useState<UserUpdateDetails>({
    name: authenticatedUser?.name ?? '',
    nickname: authenticatedUser?.nickname ?? '',
    email: authenticatedUser?.email ?? '',
  });

  useEffect(() => {
    let active = true;

    void authService.getCurrentUser()
      .then((currentUser) => {
        if (active) {
          setUserProfile(currentUser);
          authService.storeUser(currentUser);
          setForm({
            name: currentUser.name ?? '',
            nickname: currentUser.nickname ?? '',
            email: currentUser.email ?? '',
          });
          setImageVersion((version) => version + 1);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          toast.error(authService.getErrorMessage(error));
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const profile = userProfile;

  useEffect(() => {
    if (!profile?.racketId) {
      return;
    }

    const controller = new AbortController();
    void racketService.getRacketById(profile.racketId, controller.signal)
      .then(setLoadedRacket)
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          toast.error(authService.getErrorMessage(error));
        }
      });

    return () => controller.abort();
  }, [profile?.racketId]);

  const initials = useMemo(() => {
    const source = profile?.name || profile?.nickname || 'U';
    return source.trim().slice(0, 1).toUpperCase();
  }, [profile]);

  if (!profile) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <Card sx={cardSx}>
          <CardContent sx={{ p: { xs: 3, sm: 6 }, textAlign: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Inicia sesión para ver tu perfil
            </Typography>
            <Button sx={{ mt: 3 }} variant="contained" color="error" onClick={() => navigate('/login')}>
              Ir a iniciar sesión
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  const activeRacket = profile.racketId ? loadedRacket : undefined;

  const handleImageSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const image = event.target.files?.[0] ?? null;
    event.target.value = '';
    if (!image) {
      return;
    }

    setSelectedImage(image);
    setIsPhotoConfirmOpen(true);
  };

  const handleImageUpload = async () => {
    if (!selectedImage) {
      return;
    }

    setIsUploading(true);
    try {
      await authService.uploadUserImage(profile.id, selectedImage);
      setImageVersion((version) => version + 1);
      setSelectedImage(null);
      setIsPhotoConfirmOpen(false);
      setSuccessMessage('Operación realizada con éxito');
    } catch (error: unknown) {
      toast.error(authService.getErrorMessage(error));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async (emailChanged: boolean) => {
    setIsSaving(true);
    try {
      const details = {
        name: form.name.trim(),
        nickname: form.nickname.trim(),
        email: form.email.trim(),
      };

      const updatedDetails = await authService.updateUser(profile.id, details);
      const updatedUser: AuthUser = { ...profile, ...updatedDetails };
      setUserProfile((currentProfile) => currentProfile
        ? { ...currentProfile, name: details.name, nickname: details.nickname, email: details.email }
        : updatedUser);
      authService.storeUser(updatedUser);
      updateUser?.(updatedUser);
      setIsEditOpen(false);
      if (emailChanged) {
        await logout();
        navigate('/login', { replace: true });
      } else {
        setSuccessMessage('Perfil actualizado con éxito');
      }
    } catch (error: unknown) {
      toast.error(authService.getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmEdit = async () => {
    const emailChanged = form.email.trim() !== profile.email.trim();
    setIsConfirmEditOpen(false);
    setIsEditOpen(false);
    await handleSaveProfile(emailChanged);
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await authService.deleteUser(profile.id);
      await logout();
      setIsDeleteOpen(false);
      setSuccessMessage('Operación realizada con éxito');
      navigate('/');
    } catch (error: unknown) {
      toast.error(authService.getErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', gap: 2 }}>
        <Button
          startIcon={<ArrowBackRoundedIcon />}
          onClick={() => navigate(-1)}
          sx={{ color: 'grey.300', textTransform: 'none', fontWeight: 700, '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.06)' } }}
        >
          Volver
        </Button>
        <Typography variant="h5" sx={{ color: 'white', fontWeight: 900, letterSpacing: '0.12em', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
          MI PERFIL
        </Typography>
        <Stack direction="row" spacing={0.5}>
          <Button
            startIcon={<EditOutlinedIcon />}
            variant="contained"
            onClick={() => setIsEditOpen(true)}
            sx={{ bgcolor: 'white', color: 'grey.900', fontWeight: 'bold', borderRadius: 2, textTransform: 'none', '&:hover': { bgcolor: 'grey.200' } }}
          >
            Editar
          </Button>
        </Stack>
      </Box>

      <Stack spacing={2.5}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Avatar
            variant="rounded"
            src={`/api/v1/users/${profile.id}/image?v=${imageVersion}`}
            alt={profile.name ?? profile.nickname ?? 'Usuario'}
            sx={{ width: 220, height: 220, borderRadius: 4, objectFit: 'cover', mb: 2, boxShadow: 2, bgcolor: '#ef3340', fontSize: 72, fontWeight: 800 }}
          >
            {initials}
          </Avatar>
          <Button
            component="label"
            size="small"
            variant="contained"
            disabled={isUploading}
            sx={{ bgcolor: 'white', color: 'grey.900', fontWeight: 'bold', textTransform: 'none', borderRadius: 2, mt: 2, '&:hover': { bgcolor: 'grey.200' } }}
          >
            Actualizar foto
            <input type="file" hidden accept="image/*" onChange={handleImageSelection} />
          </Button>
        </Box>

        <Card elevation={3} sx={cardSx}>
          <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
            <Typography sx={{ mb: 3, color: 'grey.900', fontSize: 12, fontWeight: 800, letterSpacing: '0.16em' }}>
              DATOS DEL JUGADOR
            </Typography>
            <Grid container spacing={3}>
              {[
                ['Nombre completo', profile.name || 'Sin nombre'],
                ['Nickname', `@${profile.nickname || 'sin-nickname'}`],
                ['Email', profile.email],
              ].map(([label, value]) => (
                <Grid key={label} size={{ xs: 12, sm: 6 }}>
                  <Typography sx={{ color: 'grey.600', fontSize: 12, fontWeight: 700 }}>{label}</Typography>
                  <Typography sx={{ mt: 0.5, color: 'grey.900', fontWeight: 800, overflowWrap: 'anywhere' }}>{value}</Typography>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        {activeRacket && (
            <Card elevation={3} sx={cardSx}>
              <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
                <Typography
                    sx={{
                      mb: 2.5,
                      color: 'grey.900',
                      fontSize: 12,
                      fontWeight: 800,
                      letterSpacing: '0.16em',
                    }}
                >
                  MATERIAL ACTIVO
                </Typography>

                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    sx={{ alignItems: { xs: 'stretch', sm: 'center' } }}
                >
                  {/* Contenedor dedicado para la imagen sin recortes */}
                  <Box
                      sx={{
                        width: 80,
                        height: 100,
                        mr: { sm: 2 },
                        bgcolor: 'grey.100',
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        alignSelf: { xs: 'center', sm: 'auto' },
                        flexShrink: 0,
                      }}
                  >
                    <Box
                        component="img"
                        src={`/api/v1/rackets/${activeRacket.id}/image`}
                        alt={activeRacket.name}
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain', // Esto garantiza que la pala salga entera
                        }}
                    />
                  </Box>

                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                        sx={{
                          color: 'grey.900',
                          fontWeight: 800,
                          overflowWrap: 'anywhere',
                        }}
                    >
                      {activeRacket.brand} {activeRacket.name}
                    </Typography>

                    <Typography sx={{ mt: 0.5, color: 'grey.600', fontSize: 13 }}>
                      Pala alquilada actualmente
                    </Typography>
                  </Box>

                  <Stack
                      direction="row"
                      spacing={2}
                      sx={{
                        alignItems: 'center',
                        justifyContent: { xs: 'space-between', sm: 'flex-end' },
                        flexWrap: 'wrap',
                      }}
                  >

                    <Button
                        variant="contained"
                        color="error"
                        onClick={() => navigate('/bookings?tab=material')}
                        sx={{
                          fontWeight: 'bold',
                          textTransform: 'none',
                          borderRadius: 2,
                          px: 3,
                        }}
                    >
                      Ir a material
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
        )}
      </Stack>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 6 }}>
        <Button
          startIcon={<DeleteOutlineRoundedIcon />}
          variant="contained"
          color="error"
          onClick={() => setIsDeleteOpen(true)}
          sx={{ fontWeight: 'bold', borderRadius: 2, textTransform: 'none' }}
        >
          Eliminar Cuenta
        </Button>
      </Box>

      <Dialog
        open={isPhotoConfirmOpen}
        onClose={() => !isUploading && setIsPhotoConfirmOpen(false)}
        fullWidth
        maxWidth="sm"
        slotProps={{ paper: { sx: { bgcolor: 'white', borderRadius: 3 } } }}
      >
        <DialogTitle sx={{ color: 'grey.900', fontWeight: 800 }}>Actualizar foto de perfil</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'grey.700', lineHeight: 1.7 }}>
            ¿Deseas actualizar tu foto de perfil con la imagen seleccionada?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setSelectedImage(null);
              setIsPhotoConfirmOpen(false);
            }}
            disabled={isUploading}
            variant="text"
            sx={{ color: 'grey.700', textTransform: 'uppercase' }}
          >
            VOLVER
          </Button>
          <Button
            onClick={() => void handleImageUpload()}
            disabled={isUploading || !selectedImage}
            variant="contained"
            color="error"
            disableElevation
            sx={{ fontWeight: 800, textTransform: 'uppercase' }}
          >
            CONFIRMAR
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isEditOpen}
        onClose={() => !isSaving && setIsEditOpen(false)}
        fullWidth
        maxWidth="sm"
        slotProps={{ paper: { sx: { bgcolor: 'white', color: 'grey.900', borderRadius: 3 } } }}
      >
        <DialogTitle sx={{ color: 'grey.900', fontWeight: 800 }}>Editar Perfil</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField variant="outlined" label="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} fullWidth />
            <TextField variant="outlined" label="Nickname" value={form.nickname} onChange={(event) => setForm({ ...form, nickname: event.target.value })} fullWidth />
            <TextField variant="outlined" label="Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setIsEditOpen(false)} disabled={isSaving} variant="text" sx={{ color: 'grey.700', textTransform: 'uppercase' }}>
            VOLVER
          </Button>
          <Button onClick={() => setIsConfirmEditOpen(true)} disabled={isSaving} variant="contained" color="error" disableElevation sx={{ fontWeight: 800, textTransform: 'uppercase' }}>
            GUARDAR
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isConfirmEditOpen}
        onClose={() => !isSaving && setIsConfirmEditOpen(false)}
        fullWidth
        maxWidth="xs"
        slotProps={{ paper: { sx: { bgcolor: 'white', color: 'grey.900', borderRadius: 3 } } }}
      >
        <DialogTitle sx={{ color: 'grey.900', fontWeight: 800 }}>Confirmar cambios</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'grey.700', lineHeight: 1.7 }}>
            ¿Estás seguro de que deseas aplicar estos cambios en tu perfil?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setIsConfirmEditOpen(false)} disabled={isSaving} variant="text" sx={{ color: 'grey.700', textTransform: 'uppercase' }}>
            VOLVER
          </Button>
          <Button onClick={() => void handleConfirmEdit()} disabled={isSaving} variant="contained" color="error" disableElevation sx={{ fontWeight: 800, textTransform: 'uppercase' }}>
            CONFIRMAR
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isDeleteOpen}
        onClose={() => !isDeleting && setIsDeleteOpen(false)}
        fullWidth
        maxWidth="xs"
        slotProps={{ paper: { sx: { bgcolor: 'white', borderRadius: 3 } } }}
      >
        <DialogTitle sx={{ color: 'grey.900', fontWeight: 800 }}>¿Eliminar cuenta?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'grey.700', lineHeight: 1.7 }}>
            Esta acción es permanente. Se eliminarán tu cuenta, tus datos personales y el acceso a tus reservas. No podrás recuperar esta información.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setIsDeleteOpen(false)} disabled={isDeleting} variant="text" sx={{ color: 'grey.700', textTransform: 'uppercase' }}>
            VOLVER
          </Button>
          <Button color="error" variant="contained" disableElevation onClick={() => void handleDeleteAccount()} disabled={isDeleting} sx={{ fontWeight: 800, textTransform: 'uppercase' }}>
            ELIMINAR
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={successMessage !== null} autoHideDuration={4000} onClose={() => setSuccessMessage(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSuccessMessage(null)} severity="success" variant="filled" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </section>
  );
}

export default UserProfilePage;
