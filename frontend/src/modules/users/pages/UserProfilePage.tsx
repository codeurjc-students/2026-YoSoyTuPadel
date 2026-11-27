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
  InputAdornment,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  ArrowBackRounded as ArrowBackRoundedIcon,
  DeleteOutlineRounded as DeleteOutlineRoundedIcon,
  EditOutlined as EditOutlinedIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../auth/hooks/useAuth';
import { authService, type AuthUser, type UserUpdateDetails } from '../../auth/services/authService';
import { racketService, type RacketDTO } from '../../rackets/services/racketService';
import LevelProgressionChart from '../components/LevelProgressionChart';

const cardSx = {
  borderRadius: 4,
  bgcolor: 'white',
  color: 'grey.900',
  boxShadow: '0 12px 32px rgba(17, 19, 24, 0.08)',
  p: { xs: 1, sm: 2 },
};

const dialogPaperSx = {
  borderRadius: 4,
  bgcolor: 'white',
  color: 'grey.900',
  p: 0.5,
  m: { xs: 2, sm: 4 },
};

const dialogActionsSx = {
  px: { xs: 2.5, sm: 3 },
  pb: 2.5,
  pt: 1,
  gap: 1.25,
  flexDirection: { xs: 'column-reverse', sm: 'row' },
  '& > :not(style) ~ :not(style)': { ml: { xs: 0, sm: 1.25 } },
};

const secondaryDialogButtonSx = {
  width: { xs: '100%', sm: 'auto' },
  borderRadius: 3,
  borderColor: 'grey.300',
  color: 'grey.800',
  textTransform: 'none',
  fontWeight: 700,
  px: 2.5,
  py: 0.9,
};

const primaryDialogButtonSx = {
  width: { xs: '100%', sm: 'auto' },
  borderRadius: 3,
  bgcolor: '#e60012',
  boxShadow: '0 8px 20px rgba(230,0,18,.22)',
  '&:hover': { bgcolor: '#c4000f' },
  fontWeight: 800,
  textTransform: 'none',
  px: 2.5,
  py: 0.9,
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
    password: '',
    sessionPrice: authenticatedUser?.sessionPrice ?? null,
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
              password: '',
              sessionPrice: currentUser.sessionPrice ?? null,
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
        <Box component="section" sx={{ maxWidth: 1024, mx: 'auto', px: { xs: 2, sm: 3, lg: 4 }, py: 8 }}>
          <Card elevation={0} sx={cardSx}>
            <CardContent sx={{ p: { xs: 3, sm: 6 }, textAlign: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 900 }}>
                Inicia sesión para ver tu perfil
              </Typography>
              <Button
                  variant="contained"
                  onClick={() => navigate('/login')}
                  sx={{
                    mt: 3,
                    borderRadius: 3,
                    bgcolor: '#e60012',
                    boxShadow: '0 8px 20px rgba(230,0,18,.22)',
                    '&:hover': { bgcolor: '#c4000f' },
                    fontWeight: 800,
                    textTransform: 'none',
                    px: 3,
                  }}
              >
                Ir a iniciar sesión
              </Button>
            </CardContent>
          </Card>
        </Box>
    );
  }

  const isCoach = profile.role.toUpperCase().replace(/^ROLE_/, '') === 'COACH';
  const isAdmin = profile.role.toUpperCase().replace(/^ROLE_/, '') === 'ADMIN';
  const isUser = !isCoach && !isAdmin;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const nameIsValid = form.name.trim().length >= 4;
  const nicknameIsValid = !isCoach && !isAdmin
      ? (form.nickname ?? '').trim().length >= 4
      : true;
  const emailIsValid = form.email.trim().length > 0 && emailPattern.test(form.email.trim());
  const passwordIsValid = !form.password || form.password.length >= 8;
  const formIsValid = nameIsValid
      && nicknameIsValid
      && emailIsValid
      && passwordIsValid;
  const hasChanges = form.name !== (profile.name ?? '')
      || ((!isCoach && !isAdmin) && form.nickname !== (profile.nickname ?? ''))
      || form.email !== profile.email
      || (form.password !== undefined && form.password.trim().length > 0)
      || form.sessionPrice !== (profile.sessionPrice ?? null);
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

  const handleSaveProfile = async (requiresRelogin: boolean) => {
    if (!formIsValid) {
      return;
    }

    setIsSaving(true);
    try {
      const details: UserUpdateDetails = {
        name: form.name.trim(),
        email: form.email.trim(),
        sessionPrice: isCoach ? form.sessionPrice ?? null : undefined,
      };
      if (!isCoach && !isAdmin) {
        details.nickname = (form.nickname ?? '').trim();
      }

      if (form.password && form.password.trim().length > 0) {
        details.password = form.password.trim();
      }

      const updatedDetails = await authService.updateUser(profile.id, details);
      const updatedUser: AuthUser = { ...profile, ...updatedDetails };
      setUserProfile((currentProfile) => currentProfile
          ? {
            ...currentProfile,
            name: details.name,
            nickname: details.nickname ?? currentProfile.nickname,
            email: details.email,
            sessionPrice: details.sessionPrice,
          }
          : updatedUser);
      authService.storeUser(updatedUser);
      updateUser?.(updatedUser);
      setIsEditOpen(false);
      if (requiresRelogin) {
        await logout();
        void navigate('/login', { replace: true });
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
    const passwordChanged = form.password !== undefined && form.password.trim().length > 0;
    setIsConfirmEditOpen(false);
    setIsEditOpen(false);
    await handleSaveProfile(emailChanged || passwordChanged);
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await authService.deleteUser(profile.id);
      await logout();
      setIsDeleteOpen(false);
      setSuccessMessage('Operación realizada con éxito');
      void navigate('/');
    } catch (error: unknown) {
      toast.error(authService.getErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
      <Box component="section" sx={{ maxWidth: 1024, mx: 'auto', px: { xs: 2, sm: 3, lg: 4 }, py: { xs: 4, sm: 6 } }}>
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
          <Button
              startIcon={<ArrowBackRoundedIcon />}
              onClick={() => navigate(-1)}
              sx={{
                color: 'grey.300',
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: 3,
                flexShrink: 0,
                '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.06)' },
              }}
          >
            Volver
          </Button>
          <Typography
              component="h1"
              variant="h5"
              sx={{
                color: 'white',
                fontWeight: 900,
                letterSpacing: '0.12em',
                textAlign: 'center',
                fontSize: { xs: '1.1rem', sm: '1.5rem' },
              }}
          >
            MI PERFIL
          </Typography>
          <Button
              startIcon={<EditOutlinedIcon />}
              variant="contained"
              onClick={() => setIsEditOpen(true)}
              sx={{
                bgcolor: 'white',
                color: 'grey.900',
                fontWeight: 800,
                borderRadius: 3,
                textTransform: 'none',
                flexShrink: 0,
                px: { xs: 2, sm: 2.5 },
                '&:hover': { bgcolor: 'grey.200' },
              }}
          >
            Editar
          </Button>
        </Box>

        <Stack spacing={3}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Avatar
                variant="rounded"
                src={`/api/v1/users/${profile.id}/image?v=${imageVersion}`}
                alt={profile.name ?? profile.nickname ?? 'Usuario'}
                sx={{
                  width: { xs: 180, sm: 220 },
                  height: { xs: 180, sm: 220 },
                  borderRadius: 4,
                  objectFit: 'cover',
                  mb: 2,
                  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.25)',
                  bgcolor: '#e60012',
                  fontSize: 72,
                  fontWeight: 800,
                }}
            >
              {initials}
            </Avatar>
            <Button
                component="label"
                size="small"
                variant="contained"
                disabled={isUploading}
                sx={{
                  bgcolor: 'white',
                  color: 'grey.900',
                  fontWeight: 800,
                  textTransform: 'none',
                  borderRadius: 3,
                  px: 2.5,
                  py: 0.85,
                  '&:hover': { bgcolor: 'grey.200' },
                }}
            >
              Actualizar foto
              <input type="file" hidden accept="image/*" onChange={handleImageSelection} />
            </Button>
          </Box>

          <Card elevation={0} sx={cardSx}>
            <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
              <Typography sx={{ mb: 3, color: 'grey.900', fontSize: 12, fontWeight: 800, letterSpacing: '0.16em' }}>
                {isCoach ? 'DATOS DEL ENTRENADOR' : isAdmin ? 'DATOS DEL ADMINISTRADOR' : 'DATOS DEL JUGADOR'}
              </Typography>
              <Grid container spacing={2.5}>
                {[
                  ['Nombre completo', profile.name || 'Sin nombre'],
                  ...(isCoach
                      ? [['Precio por sesión', profile.sessionPrice == null ? 'Sin precio' : `${profile.sessionPrice} €`]]
                      : isUser
                          ? [['Nickname', `@${profile.nickname || 'sin-nickname'}`]]
                          : []),
                  ['Email', profile.email],
                ].map(([label, value]) => (
                    <Grid key={label} size={{ xs: 12, sm: 6 }}>
                      <Box sx={{ p: 1.75, bgcolor: '#f0f1f4', borderRadius: 3, height: '100%' }}>
                        <Typography sx={{ color: '#626875', fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                          {label}
                        </Typography>
                        <Typography sx={{ mt: 0.5, color: '#17191e', fontWeight: 800, overflowWrap: 'anywhere' }}>
                          {value}
                        </Typography>
                      </Box>
                    </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {isUser && <LevelProgressionChart userId={profile.id} />}

          {activeRacket && (
              <Card elevation={0} sx={cardSx}>
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
                    <Box
                        sx={{
                          width: 80,
                          height: 100,
                          mr: { sm: 2 },
                          bgcolor: '#f0f1f4',
                          borderRadius: 3,
                          p: 1,
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
                            objectFit: 'contain',
                          }}
                      />
                    </Box>

                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                          sx={{
                            color: '#17191e',
                            fontWeight: 800,
                            overflowWrap: 'anywhere',
                          }}
                      >
                        {activeRacket.brand} {activeRacket.name}
                      </Typography>

                      <Typography sx={{ mt: 0.5, color: '#626875', fontSize: 13 }}>
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
                          onClick={() => navigate('/bookings?tab=material')}
                          sx={{
                            fontWeight: 800,
                            textTransform: 'none',
                            borderRadius: 3,
                            bgcolor: '#e60012',
                            boxShadow: '0 8px 20px rgba(230,0,18,.22)',
                            '&:hover': { bgcolor: '#c4000f' },
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

        {!isAdmin && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 4 }}>
              <Button
                  startIcon={<DeleteOutlineRoundedIcon />}
                  variant="contained"
                  onClick={() => setIsDeleteOpen(true)}
                  sx={{
                    fontWeight: 800,
                    borderRadius: 3,
                    bgcolor: '#e60012',
                    boxShadow: '0 8px 20px rgba(230,0,18,.22)',
                    '&:hover': { bgcolor: '#c4000f' },
                    textTransform: 'none',
                    px: 3,
                    py: 1,
                  }}
              >
                Eliminar Cuenta
              </Button>
            </Box>
        )}

        <Dialog
            open={isPhotoConfirmOpen}
            onClose={() => !isUploading && setIsPhotoConfirmOpen(false)}
            fullWidth
            maxWidth="xs"
            slotProps={{ paper: { sx: dialogPaperSx } }}
        >
          <DialogTitle sx={{ px: { xs: 2.5, sm: 3 }, pt: 2.5, pb: 1, fontWeight: 900 }}>
            Actualizar foto de perfil
          </DialogTitle>
          <DialogContent sx={{ px: { xs: 2.5, sm: 3 }, pb: 1.5 }}>
            <DialogContentText sx={{ color: 'grey.700', lineHeight: 1.7 }}>
              ¿Deseas actualizar tu foto de perfil con la imagen seleccionada?
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={dialogActionsSx}>
            <Button
                onClick={() => {
                  setSelectedImage(null);
                  setIsPhotoConfirmOpen(false);
                }}
                disabled={isUploading}
                variant="outlined"
                color="inherit"
                sx={secondaryDialogButtonSx}
            >
              VOLVER
            </Button>
            <Button
                onClick={() => void handleImageUpload()}
                disabled={isUploading || !selectedImage}
                variant="contained"
                sx={primaryDialogButtonSx}
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
            slotProps={{ paper: { sx: dialogPaperSx } }}
        >
          <DialogTitle sx={{ px: { xs: 2.5, sm: 3 }, pt: 2.5, pb: 1, fontWeight: 900 }}>
            Editar Perfil
          </DialogTitle>
          <DialogContent sx={{ px: { xs: 2.5, sm: 3 }, pb: 1.5 }}>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                  variant="outlined"
                  label="Name"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  error={!nameIsValid}
                  helperText={nameIsValid ? '' : 'El nombre debe tener al menos 4 caracteres.'}
                  fullWidth
              />
              {isUser && (
                  <TextField
                      variant="outlined"
                      label="Nickname"
                      value={form.nickname}
                      onChange={(event) => setForm({ ...form, nickname: event.target.value })}
                      error={!nicknameIsValid}
                      helperText={nicknameIsValid ? '' : 'El nickname debe tener al menos 4 caracteres.'}
                      fullWidth
                  />
              )}
              {isCoach && (
                  <TextField
                      variant="outlined"
                      label="Precio por sesión"
                      type="number"
                      value={form.sessionPrice ?? ''}
                      onChange={(event) => setForm({ ...form, sessionPrice: event.target.value === '' ? null : Number(event.target.value) })}
                      slotProps={{
                        input: { startAdornment: <InputAdornment position="start">€</InputAdornment> },
                        htmlInput: { min: 0, step: 0.01 },
                      }}
                      fullWidth
                  />
              )}
              <TextField
                  variant="outlined"
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  error={!emailIsValid}
                  helperText={emailIsValid ? '' : 'Introduce un correo electrónico válido.'}
                  fullWidth
              />
              <TextField
                  variant="outlined"
                  label="Nueva contraseña"
                  type="password"
                  value={form.password ?? ''}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  error={!passwordIsValid}
                  helperText={passwordIsValid
                      ? 'Déjalo en blanco si no quieres cambiarla'
                      : 'La contraseña debe tener al menos 8 caracteres.'}
                  fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={dialogActionsSx}>
            <Button
                onClick={() => setIsEditOpen(false)}
                disabled={isSaving}
                variant="outlined"
                color="inherit"
                sx={secondaryDialogButtonSx}
            >
              VOLVER
            </Button>
            <Button
                onClick={() => setIsConfirmEditOpen(true)}
                disabled={isSaving || !hasChanges || !formIsValid}
                variant="contained"
                sx={primaryDialogButtonSx}
            >
              GUARDAR
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
            open={isConfirmEditOpen}
            onClose={() => !isSaving && setIsConfirmEditOpen(false)}
            fullWidth
            maxWidth="xs"
            slotProps={{ paper: { sx: dialogPaperSx } }}
        >
          <DialogTitle sx={{ px: { xs: 2.5, sm: 3 }, pt: 2.5, pb: 1, fontWeight: 900 }}>
            Confirmar cambios
          </DialogTitle>
          <DialogContent sx={{ px: { xs: 2.5, sm: 3 }, pb: 1.5 }}>
            <DialogContentText sx={{ color: 'grey.700', lineHeight: 1.7 }}>
              ¿Estás seguro de que deseas aplicar estos cambios en tu perfil?
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={dialogActionsSx}>
            <Button
                onClick={() => setIsConfirmEditOpen(false)}
                disabled={isSaving}
                variant="outlined"
                color="inherit"
                sx={secondaryDialogButtonSx}
            >
              VOLVER
            </Button>
            <Button
                onClick={() => void handleConfirmEdit()}
                disabled={isSaving || !hasChanges || !formIsValid}
                variant="contained"
                sx={primaryDialogButtonSx}
            >
              CONFIRMAR
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
            open={isDeleteOpen}
            onClose={() => !isDeleting && setIsDeleteOpen(false)}
            fullWidth
            maxWidth="xs"
            slotProps={{ paper: { sx: dialogPaperSx } }}
        >
          <DialogTitle sx={{ px: { xs: 2.5, sm: 3 }, pt: 2.5, pb: 1, fontWeight: 900 }}>
            ¿Eliminar cuenta?
          </DialogTitle>
          <DialogContent sx={{ px: { xs: 2.5, sm: 3 }, pb: 1.5 }}>
            <DialogContentText sx={{ color: 'grey.700', lineHeight: 1.7 }}>
              Esta acción es permanente. Se eliminarán tu cuenta, tus datos personales y el acceso a tus reservas. No podrás recuperar esta información.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={dialogActionsSx}>
            <Button
                onClick={() => setIsDeleteOpen(false)}
                disabled={isDeleting}
                variant="outlined"
                color="inherit"
                sx={secondaryDialogButtonSx}
            >
              VOLVER
            </Button>
            <Button
                variant="contained"
                onClick={() => void handleDeleteAccount()}
                disabled={isDeleting}
                sx={primaryDialogButtonSx}
            >
              ELIMINAR
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
            open={successMessage !== null}
            autoHideDuration={4000}
            onClose={() => setSuccessMessage(null)}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert onClose={() => setSuccessMessage(null)} severity="success" variant="filled" sx={{ width: '100%' }}>
            {successMessage}
          </Alert>
        </Snackbar>
      </Box>
  );
}

export default UserProfilePage;