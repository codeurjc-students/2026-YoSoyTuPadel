import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Card, CardContent, CircularProgress, Typography } from '@mui/material';
import {
  CartesianGrid,
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import api from '../../../service/api';
import { authService } from '../../auth/services/authService';

export interface UserProgressionData {
  date: string;
  currentLevel: number;
}

interface LevelProgressionChartProps {
  userId: number;
}

interface ProgressionTooltipProps {
  active?: boolean;
  payload?: Array<{ value?: number }>;
  label?: string;
}

function formatDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  const formattedDate = new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(year, month - 1, day));

  return formattedDate.replace(/^./, (character) => character.toUpperCase());
}

function ProgressionTooltip({ active, payload, label }: ProgressionTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
      <Box sx={{ bgcolor: 'white', border: '1px solid', borderColor: 'grey.200', borderRadius: 2, px: 2, py: 1.5, boxShadow: 3 }}>
        <Typography sx={{ color: 'grey.500', fontSize: 12, mb: 0.5 }}>{label && formatDate(label)}</Typography>
        <Typography sx={{ color: '#ef3340', fontSize: 16, fontWeight: 800 }}>
          Nivel: {payload[0].value?.toFixed(2)}
        </Typography>
      </Box>
  );
}

function LevelProgressionChart({ userId }: LevelProgressionChartProps) {
  const [progression, setProgression] = useState<UserProgressionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { chartData, domainConfig } = useMemo(() => {
    // 1. Group by date, keeping the last level of each day
    const lastProgressionByDate = progression.reduce<Record<string, UserProgressionData>>(
        (groupedProgression, entry) => ({
          ...groupedProgression,
          [entry.date]: entry,
        }),
        {},
    );

    // 2. Sort chronologically
    const sortedData = Object.values(lastProgressionByDate)
        .sort((a, b) => a.date.localeCompare(b.date));

    // 3. Calculate dynamic Y-axis domain based on user's actual progression
    if (sortedData.length === 0) {
      return { chartData: [], domainConfig: [0, 5] };
    }

    const levels = sortedData.map(d => d.currentLevel);
    const minLevel = Math.min(...levels);
    const maxLevel = Math.max(...levels);

    // Add a 0.5 padding above and below, but strict clamp between 0.0 and 5.0
    const calculatedMin = Math.max(0, Math.floor((minLevel - 0.5) * 2) / 2);
    const calculatedMax = Math.min(5, Math.ceil((maxLevel + 0.5) * 2) / 2);

    return {
      chartData: sortedData,
      domainConfig: [calculatedMin, calculatedMax]
    };
  }, [progression]);

  useEffect(() => {
    const controller = new AbortController();

    void api.get<UserProgressionData[]>(`/api/v1/users/${userId}/progression`, {
      signal: controller.signal,
    })
        .then(({ data }) => setProgression(data))
        .catch((requestError: unknown) => {
          if (!controller.signal.aborted) {
            setError(authService.getErrorMessage(requestError));
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setIsLoading(false);
          }
        });

    return () => controller.abort();
  }, [userId]);

  return (
      <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'grey.200', bgcolor: 'white', mb: 3 }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Typography sx={{ mb: 4, color: 'grey.900', fontSize: 13, fontWeight: 800, letterSpacing: '0.1em' }}>
            PROGRESIÓN DE NIVEL
          </Typography>

          {isLoading && (
              <Box sx={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress sx={{ color: '#ef3340' }} aria-label="Cargando progresión" />
              </Box>
          )}

          {!isLoading && error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

          {!isLoading && !error && chartData.length === 0 && (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                Aún no tienes entrenamientos valorados. Tu progresión aparecerá aquí después de tu primer entrenamiento.
              </Alert>
          )}

          {!isLoading && !error && chartData.length > 0 && (
              <Box sx={{ width: '100%', height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="levelProgressionGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef3340" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef3340" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                    <XAxis
                        dataKey="date"
                        tickFormatter={formatDate}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9e9e9e', fontSize: 12, dy: 10 }}
                    />
                    <YAxis
                        domain={domainConfig}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9e9e9e', fontSize: 12 }}
                        tickCount={5}
                    />
                    <Tooltip content={<ProgressionTooltip />} cursor={{ stroke: '#ef3340', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    <Area
                        type="linear"
                        dataKey="currentLevel"
                        stroke="#ef3340"
                        fill="url(#levelProgressionGradient)"
                        strokeWidth={3}
                        activeDot={{ r: 6, strokeWidth: 0, fill: '#ef3340' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
          )}
        </CardContent>
      </Card>
  );
}

export default LevelProgressionChart;