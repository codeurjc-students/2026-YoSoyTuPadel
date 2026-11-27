import { Box, Button, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

interface ComingSoonPageProps {
  title: string;
}

function ComingSoonPage({ title }: ComingSoonPageProps) {
  return (
        <Box
            component="section"
            sx={{
                mx: 'auto',
                display: 'flex',
                minHeight: '55vh',
                maxWidth: 768,
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                px: 2,
                py: 8,
                textAlign: 'center',
            }}
        >
            <Box
                component="span"
                sx={{
                    display: 'grid',
                    width: 64,
                    height: 64,
                    placeItems: 'center',
                    borderRadius: 4,
                    bgcolor: '#fef2f2',
                    fontSize: 24,
                    fontWeight: 900,
                    color: '#e60012',
                }}
            >
                YSTP
            </Box>
            <Typography
                component="p"
                sx={{
                    mt: 3,
                    fontSize: 12,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.2em',
                    color: '#e60012',
                }}
            >
                Estamos preparando la pista
            </Typography>
            <Typography
                component="h1"
                sx={{
                    mt: 1.5,
                    fontSize: { xs: 30, sm: 36 },
                    fontWeight: 900,
                    letterSpacing: '-0.025em',
                    color: 'white',
                }}
            >
                {title}
            </Typography>
            <Typography
                sx={{
                    mt: 2,
                    maxWidth: 512,
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: '#cbd5e1',
                }}
            >
        Esta sección se incorporará en una próxima entrega. Mientras tanto, puedes explorar el catálogo de palas.
      </Typography>
      <Button
        component={Link}
        to="/rackets"
                variant="contained"
                sx={{
                    mt: 3.5,
                    borderRadius: 3,
                    bgcolor: '#e60012',
                    px: 3,
                    py: 1.25,
                    fontSize: 14,
                    fontWeight: 800,
                    textTransform: 'none',
                    color: 'white',
                    boxShadow: '0 8px 20px rgba(230, 0, 18, 0.22)',
                    transition: 'transform 200ms ease, background-color 200ms ease',
                    '&:hover': {
                        bgcolor: '#c4000f',
                        transform: 'translateY(-2px)',
                    },
                }}
      >
        Explorar palas
      </Button>
      </Box>
  );
}

export default ComingSoonPage;