import { Box } from '@mui/material';
import { motion, useAnimationFrame, useMotionValue } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';

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

interface BallConfig {
  initialX: number;
  initialY: number;
  animationDelay: number;
  duration: number;
}

function PadelBall({
                     index,
                     width,
                     height,
                     config,
                   }: {
  index: number;
  width: number;
  height: number;
  config: BallConfig;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useMotionValue(0);
  const physics = useRef<BallPhysics>({
    velocityX: 0,
    velocityY: 0,
    speed: 120 + (20 - config.duration) * 8,
    currentSpeed: 120 + (20 - config.duration) * 8,
    boostStartSpeed: 120 + (20 - config.duration) * 8,
    boostElapsed: BOOST_DURATION,
    directionChanges: 0,
    initialized: false,
  });

  useEffect(() => {
    const state = physics.current;
    const maxX = Math.max(0, width - BALL_SIZE);
    const maxY = Math.max(0, height - BALL_SIZE);

    if (!state.initialized && width > 0 && height > 0) {
      x.set(maxX * config.initialX);
      y.set(maxY * config.initialY);
      // NOSONAR - Non-cryptographic random for initial animation trajectory
      const angle = Math.random() * Math.PI * 2;
      state.velocityX = Math.cos(angle) * state.speed;
      state.velocityY = Math.sin(angle) * state.speed;
      state.initialized = true;
      return;
    }

    x.set(Math.min(x.get(), maxX));
    y.set(Math.min(y.get(), maxY));
  }, [config, height, index, width, x, y]);

  useAnimationFrame((_, delta) => {
    if (!physics.current.initialized || width <= 0 || height <= 0) return;

    const state = physics.current;
    const elapsed = Math.min(delta, 32) / 1000;
    const maxX = Math.max(0, width - BALL_SIZE);
    const maxY = Math.max(0, height - BALL_SIZE);
    let nextX = x.get() + state.velocityX * elapsed;
    let nextY = y.get() + state.velocityY * elapsed;

    if (nextX < 0 || nextX > maxX) {
      nextX = Math.max(0, Math.min(nextX, maxX));
      state.velocityX *= -1;
      // NOSONAR - Non-cryptographic random for initial animation trajectory
      state.velocityY += (Math.random() - 0.5) * state.speed * 0.08;
    }
    if (nextY < 0 || nextY > maxY) {
      nextY = Math.max(0, Math.min(nextY, maxY));
      state.velocityY *= -1;
      // NOSONAR - Non-cryptographic random for initial animation trajectory
      state.velocityX += (Math.random() - 0.5) * state.speed * 0.08;
    }

    state.boostElapsed = Math.min(BOOST_DURATION, state.boostElapsed + elapsed);
    state.currentSpeed = state.speed
        + (state.boostStartSpeed - state.speed) * (state.boostElapsed / BOOST_DURATION);
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
      <Box
      component={motion.button}
      type="button"
      aria-label={`Cambiar dirección de la pelota ${index + 1}`}
      onPointerDown={changeDirection}
      onClick={(event) => {
        if (event.detail === 0) changeDirection();
      }}
      sx={{
        pointerEvents: 'auto',
        position: 'absolute',
        left: 0,
        top: 0,
        display: 'grid',
        width: BALL_SIZE,
        height: BALL_SIZE,
        cursor: 'pointer',
        placeItems: 'center',
        borderRadius: '50%',
        border: 0,
        bgcolor: 'transparent',
        p: 0,
        '&:focus-visible': {
          outline: 'none',
          boxShadow: '0 0 0 2px #d9f99d',
        },
      }}
      style={{
        x,
        y,
        rotate,
        animationDelay: `-${config.animationDelay}s`,
        animationDuration: `${config.duration}s`,
      }}
    >
    <Box
        component="span"
        sx={{
          position: 'relative',
          display: 'block',
          width: BALL_VISUAL_SIZE,
          height: BALL_VISUAL_SIZE,
          borderRadius: '50%',
          border: '1px solid rgba(217, 249, 157, 0.7)',
          background: 'radial-gradient(circle at 30% 28%, #efffa8, #b8e650 58%, #70982c)',
          boxShadow: '0 0 28px rgba(190, 242, 100, 0.48)',
        }}
      >
          <Box
              component="span"
              sx={{
                position: 'absolute',
                left: '13px',
                top: 0,
                height: '100%',
                width: 12,
                transform: 'rotate(45deg)',
                borderRadius: 99,
                borderRight: '1px solid rgba(255, 255, 255, 0.7)',
              }}
          />
          <Box
              component="span"
              sx={{
                position: 'absolute',
                left: 0,
                top: 12,
                height: 12,
                width: '100%',
                transform: 'rotate(-35deg)',
                borderRadius: 99,
                borderTop: '1px solid rgba(255, 255, 255, 0.7)',
              }}
          />
        </Box>
      </Box>
  );
}

function PadelBallField({ count = 10 }: { count?: number }) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState({ width: 0, height: 0 });
  const ballConfigs = useMemo<BallConfig[]>(
    () => Array.from({ length: count }, (_, index) => ({
      initialX: (index * 0.37 + 0.13) % 1,
      initialY: (index * 0.61 + 0.27) % 1,
      animationDelay: 1 + ((index * 1.7) % 5),
      duration: 10 + ((index * 2.3) % 10),
    })),
    [count],
  );

  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    const measure = () => {
      const { width, height } = field.getBoundingClientRect();
      setBounds({ width, height });
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(field);
    return () => observer.disconnect();
  }, []);

  return (
    <Box ref={fieldRef} sx={{ pointerEvents: 'none', position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
      {Array.from({ length: count }, (_, index) => (
        <PadelBall
          key={index}
          index={index}
          width={bounds.width}
          height={bounds.height}
          config={ballConfigs[index]}
        />
      ))}
    </Box>
  );
}

export default PadelBallField;