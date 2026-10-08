import { motion } from 'framer-motion';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {  useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PadelBallField from '../../core/components/PadelBallField';

type AuthMode = 'login' | 'register';


function AuthPage() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<AuthMode>(
    searchParams.get('mode') === 'register' ? 'register' : 'login',
  );
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const { login, register, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const isRegistering = mode === 'register';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearError();

    if (isRegistering) {
      const created = await register({ name, nickname, email, password });
      if (created) {
        setMode('login');
        setPassword('');
      }
      return;
    }

    if (await login({ email, password })) {
      navigate('/', { replace: true });
    }
  };

  const changeMode = (nextMode: AuthMode) => {
    clearError();
    setMode(nextMode);
  };

  return (
    <Box
      component="section"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        minHeight: { xs: 'auto', lg: 'calc(100vh - 160px)' },
        display: 'flex',
        alignItems: 'center',
        py: { xs: 3, sm: 5, lg: 7 },
        px: { xs: 2, sm: 3 },
      }}
    >
      <PadelBallField />
      <Grid
        container
        component="div"
        sx={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 1152, mx: 'auto', alignItems: 'stretch', pointerEvents: 'none' }}
      >
        <Grid
          size={{ xs: 12, md: 5 }}
          sx={{
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            justifyContent: 'center',
            px: { md: 4, lg: 6 },
            py: 5,
            color: 'common.white',
          }}
        >
          <Box
            component={Link}
            to="/"
            sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5, color: 'inherit', textDecoration: 'none', width: 'fit-content', pointerEvents: 'auto' }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                display: 'grid',
                placeItems: 'center',
                borderRadius: 3,
                bgcolor: 'error.main',
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: 1,
                boxShadow: '0 10px 28px rgba(230,0,18,.3)',
              }}
            >
              YSTP
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 900, letterSpacing: 2.5, fontSize: 14 }}>YOSOYTUPADEL</Typography>
              <Typography sx={{ color: 'error.light', fontWeight: 800, letterSpacing: 2.5, fontSize: 9, textTransform: 'uppercase' }}>
                Academia · App
              </Typography>
            </Box>
          </Box>

          <Typography
            component="h1"
            sx={{
              mt: 7,
              fontSize: { md: 50, lg: 64 },
              lineHeight: 0.98,
              letterSpacing: -2,
              fontWeight: 900,
            }}
          >
            Juega.
            <br />
            <Box component="span" sx={{ color: 'error.main' }}>Entrena.</Box>
            <br />
            Mejora.
          </Typography>
          <Typography sx={{ mt: 3, maxWidth: 390, color: 'grey.300', lineHeight: 1.8, fontSize: 15 }}>
            Reserva pistas, encuentra a tu entrenador ideal y prepárate para disfrutar cada punto.
          </Typography>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Paper
            elevation={0}
            sx={{
              minHeight: { xs: 560, sm: 600 },
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              p: { xs: 2.5, sm: 5, lg: 7 },
              borderRadius: { xs: 5, md: '0 32px 32px 0' },
              border: '1px solid rgba(255,255,255,.7)',
              boxShadow: '0 24px 70px rgba(0,0,0,.2)',
              pointerEvents: 'auto',
            }}
          >
            <Box sx={{ width: '100%', maxWidth: 420 }}>
              <Button
                component={Link}
                to="/"
                color="inherit"
                sx={{ display: { xs: 'inline-flex', md: 'none' }, mb: 3, px: 0, fontWeight: 700 }}
              >
                ← Volver al inicio
              </Button>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', bgcolor: 'grey.100', p: 0.5, borderRadius: 3, mb: 4 }}>
                {(['login', 'register'] as const).map((option) => {
                  const selected = mode === option;
                  return (
                    <Button
                      key={option}
                      type="button"
                      onClick={() => changeMode(option)}
                      aria-pressed={selected}
                      sx={{
                        py: 1.25,
                        borderRadius: 2.5,
                        fontWeight: 800,
                        color: selected ? 'grey.900' : 'text.secondary',
                        bgcolor: selected ? 'common.white' : 'transparent',
                        boxShadow: selected ? '0 2px 8px rgba(17,19,24,.08)' : 'none',
                        '&:hover': { bgcolor: selected ? 'common.white' : 'grey.200' },
                      }}
                    >
                      {option === 'login' ? 'Iniciar sesión' : 'Registrarse'}
                    </Button>
                  );
                })}
              </Box>

              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                <Typography sx={{ color: 'error.main', fontWeight: 900, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' }}>
                  {isRegistering ? 'Únete a la academia' : 'Bienvenido de nuevo'}
                </Typography>
                <Typography component="h2" sx={{ mt: 1, fontWeight: 900, fontSize: 32, letterSpacing: -0.8, color: 'grey.900' }}>
                  {isRegistering ? 'Crea tu cuenta' : 'Inicia sesión'}
                </Typography>
                <Typography sx={{ mt: 1, color: 'text.secondary', fontSize: 14 }}>
                  {isRegistering ? 'Empieza hoy a disfrutar del pádel.' : 'Accede para gestionar tus reservas.'}
                </Typography>

                <Box component="form" onSubmit={handleSubmit} noValidate={false} sx={{ mt: 3.5 }}>
                  <Stack spacing={2.25}>
                    {isRegistering && (
                      <>
                        <TextField
                          id="auth-name"
                          label="Nombre completo"
                          name="name"
                          autoComplete="name"
                          placeholder="Tu nombre"
                          required
                          fullWidth
                          value={name}
                          onChange={(event) => setName(event.target.value)}
                        />
                        <TextField
                          id="auth-nickname"
                          label="Nombre de usuario"
                          name="nickname"
                          autoComplete="nickname"
                          placeholder="Cómo te llamaremos"
                          required
                          fullWidth
                          value={nickname}
                          onChange={(event) => setNickname(event.target.value)}
                        />
                      </>
                    )}
                    <TextField
                      id="auth-email"
                      label="Email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="tu@email.com"
                      required
                      fullWidth
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                    <TextField
                      id="auth-password"
                      label="Contraseña"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={isRegistering ? 'new-password' : 'current-password'}
                      placeholder={isRegistering ? 'Mínimo 8 caracteres' : 'Tu contraseña'}
                      required
                      fullWidth
                      slotProps={{
                        htmlInput: isRegistering ? { minLength: 8 } : {},
                        input: {
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                onClick={() => setShowPassword((visible) => !visible)}
                                edge="end"
                                size="small"
                              >
                                <Typography sx={{ fontSize: 12, fontWeight: 800, color: 'text.secondary' }}>
                                  {showPassword ? 'Ocultar' : 'Ver'}
                                </Typography>
                              </IconButton>
                            </InputAdornment>
                          ),
                        },
                      }}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />

                    {isRegistering && (
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={acceptedTerms}
                            onChange={(event) => setAcceptedTerms(event.target.checked)}
                            color="error"
                            required
                            size="small"
                          />
                        }
                        label={
                          <Typography
                              component="span"
                              sx={{ fontSize: 12, lineHeight: 1.5, color: 'text.secondary' }}>
                            Acepto los términos del servicio y la política de privacidad.
                          </Typography>
                        }
                        sx={{ alignItems: 'center', ml: 0 }}
                      />
                    )}

                    {error && (
                      <Typography role="alert" sx={{ borderRadius: 2, px: 2, py: 1.5, bgcolor: 'error.50', color: 'error.dark', fontSize: 13 }}>
                        {error}
                      </Typography>
                    )}

                    <Button
                      type="submit"
                      variant="contained"
                      color="error"
                      disabled={isLoading}
                      fullWidth
                      sx={{
                        mt: 0.5,
                        py: 1.7,
                        borderRadius: 3,
                        fontWeight: 900,
                        letterSpacing: 1,
                        boxShadow: '0 10px 24px rgba(230,0,18,.22)',
                        transition: 'transform .2s, box-shadow .2s',
                        '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 14px 28px rgba(230,0,18,.3)' },
                      }}
                    >
                      {isLoading ? 'Un momento…' : isRegistering ? 'Crear cuenta' : 'Iniciar sesión'}
                    </Button>
                  </Stack>
                </Box>

                <Typography sx={{ mt: 3, textAlign: 'center', color: 'text.secondary', fontSize: 14 }}>
                  {isRegistering ? '¿Ya tienes cuenta?' : '¿Todavía no tienes cuenta?'}{' '}
                  <Button
                    type="button"
                    onClick={() => changeMode(isRegistering ? 'login' : 'register')}
                    sx={{ p: 0, minWidth: 0, verticalAlign: 'baseline', color: 'error.main', fontWeight: 900, textTransform: 'none' }}
                  >
                    {isRegistering ? 'Inicia sesión' : 'Regístrate aquí'}
                  </Button>
                </Typography>
              </motion.div>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default AuthPage;
