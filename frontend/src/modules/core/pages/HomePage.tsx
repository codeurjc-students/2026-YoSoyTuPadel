import { useEffect, useState } from 'react';
import { Box, Button, Skeleton, Stack, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import api from '../../../service/api';
import { racketService } from '../../rackets/services/racketService';
import { useAuth } from '../../auth/hooks/useAuth';

const activities = [
  {
    eyebrow: 'Tu próximo partido',
    title: 'Reserva una pista',
    description: 'Encuentra un horario disponible y céntrate en el juego.',
    to: '/courts',
    action: 'Ver pistas',
    image: '/images/padel-court-overhead.jpg',
    visual: 'linear-gradient(to bottom right, #334155, #0f172a, #000000)',
  },
  {
    eyebrow: 'Mejora tu juego',
    title: 'Entrena con expertos',
    description: 'Descubre entrenadores certificados para todos los niveles.',
    to: '/coaches',
    action: 'Ver entrenadores',
    image: '/images/coach-training.jpg',
    visual: 'linear-gradient(to bottom right, #450a0a, #111318, #000000)',
  },
  {
    eyebrow: 'Prueba algo nuevo',
    title: 'Elige tu pala',
    description: 'Explora el catálogo y encuentra tu próxima compañera de pista.',
    to: '/rackets',
    action: 'Explorar palas',
    image: '/images/racket-collection.jpg',
    visual: 'linear-gradient(to bottom right, #3f3f46, #111318, #000000)',
  },
];

interface HomeStats {
  courts: number | null;
  coaches: number | null;
  rackets: number | null;
}

const statLabels: { key: keyof HomeStats; label: string }[] = [
  { key: 'courts', label: 'Pistas' },
  { key: 'coaches', label: 'Entrenadores' },
  { key: 'rackets', label: 'Palas disponibles' },
];

async function getTotalRacketStock(signal: AbortSignal): Promise<number> {
  let page = 0;
  let totalStock = 0;
  let last = false;

  while (!last) {
    const result = await racketService.getRackets(page, 10, signal);
    totalStock += result.content.reduce((total, racket) => total + (racket.stock ?? 0), 0);
    last = result.last;
    page += 1;
  }

  return totalStock;
}

function HomePage() {
  const { user } = useAuth();
  const isAdmin = user?.role.toUpperCase().replace(/^ROLE_/, '') === 'ADMIN';
  const isCoach = user?.role.toUpperCase().replace(/^ROLE_/, '') === 'COACH';
  const [stats, setStats] = useState<HomeStats | null>(null);
  const today = new Date();
  const formattedDate = new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
  }).format(today);

  useEffect(() => {
    const controller = new AbortController();
    const options = { signal: controller.signal };
    const statsRequests = Promise.allSettled([
      api.get<{ totalElements: number }>('/api/v1/courts', options),
      api.get<{ totalElements: number }>('/api/v1/users/coaches', options),
      getTotalRacketStock(controller.signal),
    ]);

    void statsRequests.then(([courts, coaches, rackets]) => {
      if (controller.signal.aborted) {
        return;
      }

      setStats({
        courts: courts.status === 'fulfilled' ? courts.value.data.totalElements : null,
        coaches: coaches.status === 'fulfilled' ? coaches.value.data.totalElements : null,
        rackets: rackets.status === 'fulfilled' ? rackets.value : null,
      });
    });

    return () => controller.abort();
  }, []);

  return (
      <Box>
        <Box component="section" sx={{ position: 'relative', isolation: 'isolate', overflow: 'hidden', color: 'white' }}>
          <Box
              aria-hidden="true"
              sx={{
                position: 'absolute',
                right: -96,
                top: -160,
                zIndex: -1,
                width: 448,
                height: 448,
                borderRadius: '50%',
                bgcolor: 'rgba(230, 0, 18, 0.15)',
                filter: 'blur(64px)',
              }}
          />
          <Box
              aria-hidden="true"
              sx={{
                position: 'absolute',
                bottom: -256,
                left: '33.333%',
                zIndex: -1,
                width: 480,
                height: 480,
                borderRadius: '50%',
                border: '70px solid rgba(255, 255, 255, 0.03)',
              }}
          />
          <Box
              sx={{
                mx: 'auto',
                display: 'grid',
                maxWidth: 1280,
                gap: 5,
                px: { xs: 2, sm: 3, lg: 4 },
                py: { xs: 8, sm: 10, lg: 12 },
                gridTemplateColumns: { xs: '1fr', lg: '1.15fr 0.85fr' },
                alignItems: { lg: 'center' },
              }}
          >
            <Box>
              <Box
                  component={motion.p}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  sx={{
                    mt: 0,
                    mb: 2.5,
                    display: 'inline-flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: 1,
                    borderRadius: 99,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    bgcolor: 'rgba(255, 255, 255, 0.06)',
                    px: 2,
                    py: 1,
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.17em',
                    color: '#cbd5e1',
                  }}
              >
                <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#e60012' }} />
                <Box
                    component="time"
                    dateTime={today.toISOString().slice(0, 10)}
                    sx={{ ml: 0.5, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: '#94a3b8' }}
                >
                  {formattedDate}
                </Box>
              </Box>
              <Typography
                  component={motion.h1}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.05 }}
                  sx={{
                    maxWidth: 768,
                    fontSize: { xs: 48, sm: 60, lg: 72 },
                    fontWeight: 900,
                    lineHeight: 0.98,
                    letterSpacing: '-0.025em',
                  }}
              >
                Juega.
                <br />
                <Box component="span" sx={{ color: '#e60012' }}>Entrena.</Box>
                <br />
                Mejora.
              </Typography>
              <Typography sx={{ mt: 3, maxWidth: 576, fontSize: { xs: 16, sm: 18 }, lineHeight: 1.75, color: '#cbd5e1' }}>
                Organiza tu experiencia de pádel en un mismo lugar. Reserva pistas, encuentra entrenador y descubre material para tu próximo partido.
              </Typography>
            </Box>

            <Box
                component={motion.aside}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                sx={{
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: 4,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  bgcolor: 'rgba(255, 255, 255, 0.06)',
                  p: { xs: 3, sm: 4 },
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(8px)',
                }}
            >
              <Box
                  aria-hidden="true"
                  sx={{
                    position: 'absolute',
                    right: -40,
                    top: -40,
                    width: 176,
                    height: 176,
                    borderRadius: '50%',
                    border: '24px solid rgba(230, 0, 18, 0.2)',
                  }}
              />
              <Box sx={{ position: 'relative' }}>
                <Typography sx={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#e60012' }}>
                  YoSoyTuPadel
                </Typography>
                <Typography component="h2" sx={{ mt: 2, fontSize: { xs: 24, sm: 30 }, fontWeight: 800, lineHeight: 1.2 }}>
                  Todo empieza con el siguiente punto.
                </Typography>
                <Typography sx={{ mt: 1.5, fontSize: 14, lineHeight: 1.6, color: '#cbd5e1' }}>
                  Elige qué te apetece hacer hoy y nosotros te ayudamos con el resto.
                </Typography>
                <Box sx={{ mt: 4, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 1.5 }}>
                  {statLabels.map(({ key, label }) => (
                      <Box
                          key={key}
                          sx={{
                            borderRadius: 4,
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            bgcolor: 'rgba(0, 0, 0, 0.2)',
                            p: { xs: 1.5, sm: 2 },
                          }}
                      >
                        {stats ? (
                            <Typography
                                aria-label={stats[key] === null ? `${label}: no disponible` : `${stats[key]} ${label.toLowerCase()}`}
                                sx={{ fontSize: { xs: 20, sm: 24 }, fontWeight: 900, color: 'white' }}
                            >
                              {stats[key] ?? '—'}
                            </Typography>
                        ) : (
                            <Skeleton
                                variant="rounded"
                                width={40}
                                height={28}
                                aria-label={`Cargando ${label.toLowerCase()}`}
                                sx={{ bgcolor: 'rgba(255, 255, 255, 0.15)' }}
                            />
                        )}
                        <Typography sx={{ mt: 0.5, fontSize: { xs: 10, sm: 12 }, lineHeight: 1.35, color: '#94a3b8' }}>
                          {label}
                        </Typography>
                      </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>

        {!isAdmin && !isCoach && (
            <Box
                component="section"
                sx={{
                  position: 'relative',
                  isolation: 'isolate',
                  mx: 'auto',
                  maxWidth: 1280,
                  overflow: 'hidden',
                  px: { xs: 2, sm: 3, lg: 4 },
                  py: { xs: 7, sm: 8 },
                  color: 'white',
                }}
            >
              <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1.5}
                  sx={{ mb: 3.5, alignItems: { sm: 'flex-end' }, justifyContent: { sm: 'space-between' } }}
              >
                <Box>
                  <Typography sx={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#e60012' }}>
                    Vamos a jugar
                  </Typography>
                  <Typography component="h2" sx={{ mt: 1, fontSize: { xs: 24, sm: 30 }, fontWeight: 900, letterSpacing: '-0.025em', color: 'white' }}>
                    ¿Qué necesitas hoy?
                  </Typography>
                </Box>
                <Stack spacing={1} sx={{ alignItems: { sm: 'flex-end' } }}>
                  <Box
                      component="time"
                      dateTime={today.toISOString().slice(0, 10)}
                      sx={{ fontSize: 14, fontWeight: 600, textTransform: 'capitalize', color: '#cbd5e1' }}
                  >
                    {formattedDate}
                  </Box>
                </Stack>
              </Stack>

              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' } }}>
                {activities.filter((activity) => !isAdmin || activity.to !== '/coaches').map((activity, index) => (
                    <Box
                        component={motion.article}
                        key={activity.to}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: index * 0.08 }}
                        whileHover={{ y: -5 }}
                        sx={{
                          position: 'relative',
                          isolation: 'isolate',
                          display: 'flex',
                          minHeight: 320,
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          overflow: 'hidden',
                          borderRadius: 4,
                          background: activity.visual,
                          p: { xs: 3, sm: 3.5 },
                          color: 'white',
                          boxShadow: '0 12px 32px rgba(17, 19, 24, 0.08)',
                          '&:hover .card-bg-img': { transform: 'scale(1.05)' },
                          '&:hover .card-overlay': {
                            background: 'linear-gradient(to top, rgba(0, 0, 0, 0.95), rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.1))',
                          },
                          '&:hover .card-ring': { transform: 'scale(1.1)' },
                          '&:hover .card-arrow': { transform: 'translateX(4px)' },
                        }}
                    >
                      <Box
                          component="img"
                          className="card-bg-img"
                          src={activity.image}
                          alt=""
                          aria-hidden="true"
                          sx={{
                            position: 'absolute',
                            insetInline: 0,
                            top: 0,
                            zIndex: -2,
                            height: '60%',
                            width: '100%',
                            objectFit: 'cover',
                            transition: 'transform 700ms ease',
                          }}
                      />
                      <Box
                          component="span"
                          className="card-overlay"
                          aria-hidden="true"
                          sx={{
                            position: 'absolute',
                            inset: 0,
                            zIndex: -1,
                            background: 'linear-gradient(to top, #000000, rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.1))',
                            transition: 'background 300ms ease',
                          }}
                      />
                      <Box
                          component="span"
                          className="card-ring"
                          aria-hidden="true"
                          sx={{
                            position: 'absolute',
                            right: -36,
                            top: -40,
                            zIndex: -1,
                            width: 176,
                            height: 176,
                            borderRadius: '50%',
                            border: '30px solid rgba(230, 0, 18, 0.15)',
                            transition: 'transform 500ms ease',
                          }}
                      />
                      <Typography component="span" sx={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#cbd5e1' }}>
                        {activity.eyebrow}
                      </Typography>
                      <Box>
                        <Typography component="h3" sx={{ fontSize: 24, fontWeight: 900 }}>
                          {activity.title}
                        </Typography>
                        <Typography sx={{ mt: 1, maxWidth: 320, fontSize: 14, lineHeight: 1.6, color: '#cbd5e1' }}>
                          {activity.description}
                        </Typography>
                        <Button
                            component={Link}
                            to={activity.to}
                            variant="contained"
                            sx={{
                              mt: 2.5,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 1,
                              borderRadius: 3,
                              bgcolor: '#e60012',
                              px: 2,
                              py: 1.1,
                              fontSize: 14,
                              fontWeight: 800,
                              textTransform: 'none',
                              color: 'white',
                              boxShadow: 'none',
                              '&:hover': { bgcolor: '#c4000f', boxShadow: 'none' },
                            }}
                        >
                          {activity.action}
                          <Box component="span" className="card-arrow" aria-hidden="true" sx={{ transition: 'transform 200ms ease' }}>
                            →
                          </Box>
                        </Button>
                      </Box>
                    </Box>
                ))}
              </Box>
            </Box>
        )}
      </Box>
  );
}

export default HomePage;