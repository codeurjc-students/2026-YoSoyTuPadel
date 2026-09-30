import { motion, useAnimationFrame, useMotionValue } from 'framer-motion';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

type AuthMode = 'login' | 'register';

const BALL_SIZE = 56;
const BALL_VISUAL_SIZE = 44;
const BOOST_DURATION = 2;

interface BallPhysics {
  velocityX: number;
  velocityY: number;
  speed: number;
  currentSpeed: number;
  boostStartSpeed: number;
  boostElapsed: number;
  directionChanges: number;
  initialized: boolean;
}

function PadelBall({
  index,
  width,
  height,
}: {
  index: number;
  width: number;
  height: number;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useMotionValue(0);
  const physics = useRef<BallPhysics>({
    velocityX: 0,
    velocityY: 0,
    speed: 90 + index * 22,
    currentSpeed: 90 + index * 22,
    boostStartSpeed: 90 + index * 22,
    boostElapsed: BOOST_DURATION,
    directionChanges: 0,
    initialized: false,
  });

  useEffect(() => {
    const state = physics.current;
    const maxX = Math.max(0, width - BALL_SIZE);
    const maxY = Math.max(0, height - BALL_SIZE);

    if (!state.initialized) {
      x.set(maxX * ((index + 1) / 4));
      y.set(maxY * ((index + 1) / 4));
      const angle = Math.random() * Math.PI * 2;
      state.velocityX = Math.cos(angle) * state.speed;
      state.velocityY = Math.sin(angle) * state.speed;
      state.currentSpeed = state.speed;
      state.initialized = true;
      return;
    }

    x.set(Math.min(x.get(), maxX));
    y.set(Math.min(y.get(), maxY));
  }, [height, index, width, x, y]);

  useAnimationFrame((_, delta) => {
    if (!physics.current.initialized || width <= 0 || height <= 0) {
      return;
    }

    const state = physics.current;
    const maxX = Math.max(0, width - BALL_SIZE);
    const maxY = Math.max(0, height - BALL_SIZE);
    const elapsed = Math.min(delta, 32) / 1000;
    let nextX = x.get() + state.velocityX * elapsed;
    let nextY = y.get() + state.velocityY * elapsed;

    if (nextX < 0 || nextX > maxX) {
      nextX = Math.max(0, Math.min(nextX, maxX));
      state.velocityX *= -1;
      state.velocityY += (Math.random() - 0.5) * state.speed * 0.08;
    }
    if (nextY < 0 || nextY > maxY) {
      nextY = Math.max(0, Math.min(nextY, maxY));
      state.velocityY *= -1;
      state.velocityX += (Math.random() - 0.5) * state.speed * 0.08;
    }

    state.boostElapsed = Math.min(BOOST_DURATION, state.boostElapsed + elapsed);
    const boostProgress = state.boostElapsed / BOOST_DURATION;
    state.currentSpeed = state.speed + (state.boostStartSpeed - state.speed) * boostProgress;
    const velocityMagnitude = Math.hypot(state.velocityX, state.velocityY) || 1;
    state.velocityX = (state.velocityX / velocityMagnitude) * state.currentSpeed;
    state.velocityY = (state.velocityY / velocityMagnitude) * state.currentSpeed;

    x.set(nextX);
    y.set(nextY);
    rotate.set(rotate.get() + state.currentSpeed * elapsed * 2);
  });

  const changeDirection = () => {
    const state = physics.current;
    const currentAngle = Math.atan2(state.velocityY, state.velocityX);
    const turnDirection = (index + state.directionChanges) % 2 === 0 ? 1 : -1;
    const newAngle = currentAngle + turnDirection * (Math.PI * 0.75);
    state.directionChanges += 1;
    state.boostStartSpeed = state.speed * 3;
    state.currentSpeed = state.boostStartSpeed;
    state.boostElapsed = 0;
    state.velocityX = Math.cos(newAngle) * state.currentSpeed;
    state.velocityY = Math.sin(newAngle) * state.currentSpeed;
  };

  return (
    <motion.button
      type="button"
      aria-label={`Cambiar dirección de la pelota ${index + 1}`}
      onPointerDown={changeDirection}
      onClick={(event) => {
        if (event.detail === 0) {
          changeDirection();
        }
      }}
      className="pointer-events-auto absolute left-0 top-0 grid h-14 w-14 cursor-pointer place-items-center rounded-full border-0 bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-200"
      style={{ x, y, rotate }}
    >
      <span
        className="relative block rounded-full border border-lime-200/70 bg-[radial-gradient(circle_at_30%_28%,#efffa8,#b8e650_58%,#70982c)] shadow-[0_0_28px_rgba(190,242,100,0.48)]"
        style={{ width: BALL_VISUAL_SIZE, height: BALL_VISUAL_SIZE }}
      >
        <span className="absolute left-[13px] top-0 h-full w-3 rotate-45 rounded-full border-r border-white/70" />
        <span className="absolute left-0 top-3 h-3 w-full rotate-[-35deg] rounded-full border-t border-white/70" />
      </span>
    </motion.button>
  );
}

function PadelBallField() {
  const fieldRef = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const field = fieldRef.current;
    if (!field) {
      return;
    }

    const measure = () => {
      const { width, height } = field.getBoundingClientRect();
      setBounds({ width, height });
    };

    measure();
    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(measure);
    observer.observe(field);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={fieldRef}
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      {[0, 1, 2].map((index) => (
        <PadelBall key={index} index={index} width={bounds.width} height={bounds.height} />
      ))}
    </div>
  );
}

function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
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
      const registered = await register({ name, nickname, email, password });
      if (registered) {
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
    <section className="relative isolate min-h-[calc(100vh-160px)] w-full flex-1 overflow-hidden">
      <PadelBallField />

      <div className="pointer-events-none relative z-10 mx-auto grid min-h-[calc(100vh-160px)] w-full max-w-6xl px-4 py-8 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8 lg:py-12">
      <aside className="pointer-events-none relative z-20 hidden min-h-[580px] bg-transparent p-8 text-white lg:flex lg:flex-col lg:justify-center xl:p-10">
        <Link to="/" className="pointer-events-auto relative z-20 inline-flex w-fit items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-red text-xs font-black tracking-wider shadow-red">YSTP</span>
          <span>
            <span className="block text-sm font-black tracking-[0.2em]">YOSOYTUPADEL</span>
            <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-[0.34em] text-brand-red">Academia · App</span>
          </span>
        </Link>

        <div className="relative z-20 max-w-lg">
          <h1 className="mt-5 text-5xl font-black leading-[0.97] tracking-tight xl:text-6xl">
            Juega.
            <br />
            <span className="text-brand-red">Entrena.</span>
            <br />
            Mejora.
          </h1>
          <p className="mt-6 max-w-md text-sm leading-7 text-slate-300">
            Reserva pistas, encuentra a tu entrenador ideal y prepárate para disfrutar cada punto.
          </p>
        </div>

      </aside>

      <div className="pointer-events-auto relative z-10 flex min-h-[580px] items-center justify-center overflow-hidden rounded-[2rem] border border-white/10 bg-white p-5 shadow-2xl shadow-black/20 sm:p-8 lg:rounded-l-none lg:rounded-r-[2rem] lg:p-10 xl:p-12">
        <div className="relative z-20 w-full max-w-sm">
          <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-brand-muted transition hover:text-brand-red lg:hidden">
            <span aria-hidden="true">←</span> Volver al inicio
          </Link>

          <div className="relative z-20 mb-8 grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
            <button
              type="button"
              aria-pressed={!isRegistering}
              onClick={() => changeMode('login')}
              className={`rounded-xl px-4 py-3 text-sm font-bold transition duration-200 active:scale-[0.98] ${
                !isRegistering ? 'bg-white text-brand-ink shadow-sm' : 'text-brand-muted hover:text-brand-ink'
              }`}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              aria-pressed={isRegistering}
              onClick={() => changeMode('register')}
              className={`rounded-xl px-4 py-3 text-sm font-bold transition duration-200 active:scale-[0.98] ${
                isRegistering ? 'bg-white text-brand-ink shadow-sm' : 'text-brand-muted hover:text-brand-ink'
              }`}
            >
              Registrarse
            </button>
          </div>

          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-red">
              {isRegistering ? 'Únete a la academia' : 'Bienvenido de nuevo'}
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-brand-ink">
              {isRegistering ? 'Crea tu cuenta' : 'Inicia sesión'}
            </h2>
            <p className="mt-2 text-sm text-brand-muted">
              {isRegistering ? 'Empieza hoy a disfrutar del pádel.' : 'Accede para gestionar tus reservas.'}
            </p>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              {isRegistering && (
                <>
                  <label className="block text-sm font-semibold text-brand-ink">
                    Nombre completo
                    <input
                      autoComplete="name"
                      required
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3.5 text-sm font-normal outline-none transition placeholder:text-slate-400 focus:border-brand-red focus:bg-white focus:ring-4 focus:ring-brand-red/10"
                      placeholder="Tu nombre"
                    />
                  </label>
                  <label className="block text-sm font-semibold text-brand-ink">
                    Nombre de usuario
                    <input
                      autoComplete="nickname"
                      required
                      value={nickname}
                      onChange={(event) => setNickname(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3.5 text-sm font-normal outline-none transition placeholder:text-slate-400 focus:border-brand-red focus:bg-white focus:ring-4 focus:ring-brand-red/10"
                      placeholder="Cómo te llamaremos"
                    />
                  </label>
                </>
              )}

              <label className="block text-sm font-semibold text-brand-ink">
                Email
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3.5 text-sm font-normal outline-none transition placeholder:text-slate-400 focus:border-brand-red focus:bg-white focus:ring-4 focus:ring-brand-red/10"
                  placeholder="tu@email.com"
                />
              </label>

              <label className="block text-sm font-semibold text-brand-ink">
                Contraseña
                <span className="relative mt-2 block">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={isRegistering ? 'new-password' : 'current-password'}
                    required
                    minLength={isRegistering ? 8 : undefined}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3.5 pr-14 text-sm font-normal outline-none transition placeholder:text-slate-400 focus:border-brand-red focus:bg-white focus:ring-4 focus:ring-brand-red/10"
                    placeholder={isRegistering ? 'Mínimo 8 caracteres' : 'Tu contraseña'}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute inset-y-0 right-0 rounded-r-xl px-4 text-slate-500 transition hover:text-brand-red"
                  >
                    {showPassword ? 'Ocultar' : 'Ver'}
                  </button>
                </span>
              </label>

              {isRegistering && (
                <label className="flex items-start gap-3 text-xs leading-5 text-brand-muted">
                  <input
                    type="checkbox"
                    required
                    checked={acceptedTerms}
                    onChange={(event) => setAcceptedTerms(event.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-brand-red"
                  />
                  <span>Acepto los términos del servicio y la política de privacidad.</span>
                </label>
              )}

              {error && (
                <p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-red px-5 py-4 text-sm font-black uppercase tracking-[0.1em] text-white shadow-red transition duration-200 hover:-translate-y-0.5 hover:bg-red-600 active:scale-[0.99] disabled:cursor-wait disabled:opacity-70"
              >
                {isLoading && <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
                {isLoading ? 'Un momento…' : isRegistering ? 'Crear cuenta' : 'Iniciar sesión'}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-brand-muted">
              {isRegistering ? '¿Ya tienes cuenta?' : '¿Todavía no tienes cuenta?'}{' '}
              <button
                type="button"
                onClick={() => changeMode(isRegistering ? 'login' : 'register')}
                className="font-bold text-brand-red transition hover:text-red-700"
              >
                {isRegistering ? 'Inicia sesión' : 'Regístrate aquí'}
              </button>
            </p>
          </motion.div>
        </div>
      </div>
      </div>
    </section>
  );
}

export default AuthPage;
