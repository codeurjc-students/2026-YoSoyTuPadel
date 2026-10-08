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
    <motion.button
      type="button"
      aria-label={`Cambiar dirección de la pelota ${index + 1}`}
      onPointerDown={changeDirection}
      onClick={(event) => {
        if (event.detail === 0) changeDirection();
      }}
      className="pointer-events-auto absolute left-0 top-0 grid h-14 w-14 cursor-pointer place-items-center rounded-full border-0 bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-200"
      style={{
        x,
        y,
        rotate,
        animationDelay: `-${config.animationDelay}s`,
        animationDuration: `${config.duration}s`,
      }}
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
    <div ref={fieldRef} className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {Array.from({ length: count }, (_, index) => (
        <PadelBall
          key={index}
          index={index}
          width={bounds.width}
          height={bounds.height}
          config={ballConfigs[index]}
        />
      ))}
    </div>
  );
}

export default PadelBallField;
