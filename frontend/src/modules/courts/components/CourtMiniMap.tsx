import { useMemo } from 'react';
import { Box } from '@mui/material';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import type { LatLngExpression } from 'leaflet';

import 'leaflet/dist/leaflet.css';

const markerIcon = new L.Icon({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).toString(),
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).toString(),
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).toString(),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export interface CourtMapProps {
  latitude: number;
  longitude: number;
  name: string;
  interactive?: boolean;
  className?: string;
}

function CourtMap({
  latitude,
  longitude,
  name,
  interactive = true,
  className,
}: CourtMapProps) {
  const position = useMemo<LatLngExpression>(() => [latitude, longitude], [latitude, longitude]);

  return (
      <Box
          sx={{
            position: 'relative',
            zIndex: 0,
            isolation: 'isolate',
            width: '100%',
            height: '100%',
            minHeight: 140,
            '& .leaflet-container': {
              width: '100%',
              height: '100%',
              zIndex: 0,
            },
          }}
      >
        <MapContainer
            center={position}
            zoom={interactive ? 16 : 15}
            scrollWheelZoom={interactive}
            dragging={interactive}
            doubleClickZoom={interactive}
            touchZoom={interactive}
            zoomControl={interactive}
            className={className}
            style={{ height: '100%', minHeight: 140, width: '100%' }}
            attributionControl
        >
          <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position} icon={markerIcon}>
            <Popup>{name}</Popup>
          </Marker>
        </MapContainer>
      </Box>
  );
}

export default CourtMap;
