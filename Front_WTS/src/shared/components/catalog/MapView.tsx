import { useEffect, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card } from '@/shared/components/ui/card';

// Fix: Vite no resuelve los iconos por defecto de Leaflet automáticamente
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// ============================================================
// 🧪 DATOS TEMPORALES DE PRUEBA
// ============================================================
// ESTE BLOQUE ES TEMPORAL.
//
// Se utiliza únicamente para comprobar que:
// - Leaflet funciona
// - Los markers funcionan
// - Las coordenadas funcionan
// - Los Popup funcionan
//
// CUANDO CONECTEMOS EL BACKEND:
// ❌ ELIMINAR ESTE BLOQUE COMPLETO
// ============================================================

const testServices: MapService[] = [
  {
    id: 'test-1',
    name: 'Servicio de prueba',
    location: 'Bogotá',
    latitude: 4.711,
    longitude: -74.0721,
  },
];

// ============================================================
// ICONO DE LEAFLET
// ============================================================

const defaultIcon = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// ============================================================
// 🆕 ICONO DEL USUARIO (Fase 2 - Geolocalización)
// ============================================================
// Un punto azul simple, no necesita imágenes extra.
// Sirve para diferenciar visualmente "yo estoy aquí" de los
// markers de servicios (que usan defaultIcon).
// ============================================================

const userIcon = L.divIcon({
  className: '', // evita estilos default de Leaflet
  html: `
    <div style="
      width: 16px;
      height: 16px;
      background: #3b82f6;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 4px rgba(0,0,0,0.4);
    "></div>
  `,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

interface MapService {
  id: string;
  name: string;
  location: string;
  image?: string;
  price?: number;
  lat?: number | string;
  lng?: number | string;
  latitude?: number | string;
  longitude?: number | string;
}

// ============================================================
// 🆕 TIPO PARA LA UBICACIÓN DEL USUARIO (Fase 2)
// ============================================================

interface UserPosition {
  lat: number;
  lng: number;
  accuracy?: number; // radio de error en metros, si está disponible
}

interface MapViewProps {
  services: MapService[];
  onServiceClick?: (service: MapService) => void;
  userPosition?: UserPosition | null; // 🆕 Fase 2 - opcional, no rompe usos anteriores
  layoutKey?: string;
}

const DEFAULT_CENTER: [number, number] = [4.711, -74.0721]; // Bogotá

function toNumber(value?: number | string) {
  if (value === undefined || value === null || value === '') return null;

  const n = Number(value);

  return Number.isFinite(n) ? n : null;
}

function getServicePosition(
  service: MapService
): [number, number] | null {
  const lat = toNumber(
    service.lat ?? service.latitude
  );

  const lng = toNumber(
    service.lng ?? service.longitude
  );

  if (
    lat === null ||
    lng === null ||
    (lat === 0 && lng === 0)
  ) {
    return null;
  }

  return [lat, lng];
}

// Recalcula el tamaño de Leaflet cuando el contenedor cambia (p. ej. Solo Mapa)
// y encuadra de nuevo los markers para que no queden cortados.
function SyncMapViewport({
  positions,
  userPosition,
  layoutKey,
}: {
  positions: [number, number][];
  userPosition?: UserPosition | null;
  layoutKey?: string;
}) {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);

  useEffect(() => {
    const fit = () => {
      map.invalidateSize();

      const allPoints: [number, number][] = [...positions];

      if (userPosition) {
        allPoints.push([userPosition.lat, userPosition.lng]);
      }

      if (allPoints.length === 0) return;

      if (allPoints.length === 1) {
        map.setView(allPoints[0], 14);
      } else {
        map.fitBounds(L.latLngBounds(allPoints), { padding: [40, 40] });
      }
    };

    const frame = requestAnimationFrame(fit);
    const timer = window.setTimeout(fit, 200);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [map, positions, userPosition, layoutKey]);

  return null;
}

export function MapView({
  services,
  onServiceClick,
  userPosition, // 🆕
  layoutKey,
}: MapViewProps) {

  // ==========================================================
  // 🔴 BLOQUE ORIGINAL — DATOS REALES DEL BACKEND
  // ==========================================================
  //
  // ESTE ES EL BLOQUE QUE YA TENÍAS.
  //
  // Lo dejamos comentado TEMPORALMENTE porque todavía
  // no tenemos configurados los servicios con coordenadas
  // reales en nuestra BD.
  //
  // CUANDO EL BACKEND ESTÉ LISTO:
  //
  // 1. Elimina el bloque 🧪 testServices de arriba.
  //
  // 2. Comenta/elimina el bloque 🟡 de prueba.
  //
  // 3. Descomenta ESTE bloque.
  //
  // ==========================================================

  
  const servicesWithPosition = useMemo(
    () =>
      services
        .map((service) => ({
          service,
          position: getServicePosition(service),
        }))
        .filter(
          (
            item
          ): item is {
            service: MapService;
            position: [number, number];
          } => item.position !== null
        ),
    [services]
  );
  


  // ==========================================================
  // 🟡 BLOQUE TEMPORAL — SERVICIO DE PRUEBA
  // ==========================================================
  //
  // ESTE BLOQUE ESTÁ ACTIVO AHORA.
  //
  // Sirve para comprobar que Leaflet puede recibir
  // un servicio con latitude + longitude y dibujar
  // correctamente su Marker.
  //
  // CUANDO TODO ESTÉ CONECTADO:
  //
  // ❌ ELIMINAR ESTE BLOQUE
  //
  // ✅ DESCOMENTAR EL BLOQUE 🔴 DE ARRIBA
  //
  // ==========================================================
/*
  const servicesWithPosition = useMemo(
    () =>
      testServices
        .map((service) => ({
          service,
          position: getServicePosition(service),
        }))
        .filter(
          (
            item
          ): item is {
            service: MapService;
            position: [number, number];
          } => item.position !== null
        ),
    []
  );
*/
  // ==========================================================
  // POSICIONES DE LOS SERVICIOS
  // ==========================================================

  const positions = useMemo(
    () =>
      servicesWithPosition.map(
        (s) => s.position
      ),
    [servicesWithPosition]
  );

  // ==========================================================
  // MAPA
  // ==========================================================

  return (
    <Card className="relative z-0 isolate h-full overflow-hidden bg-gray-100">

      <MapContainer
        center={DEFAULT_CENTER}
        zoom={servicesWithPosition.length ? 12 : 6}
        className="isolate z-0"
        style={{
          height: '100%',
          width: '100%',
        }}
        scrollWheelZoom
      >

        {/* ====================================================
            OPENSTREETMAP
            ==================================================== */}

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* ====================================================
            MARKERS
            ==================================================== */}

        {servicesWithPosition.map(
          ({ service, position }) => (
            <Marker
              key={service.id}
              position={position}
              icon={defaultIcon}
              eventHandlers={{
                click: () =>
                  onServiceClick?.(service),
              }}
            >
              <Popup>
                {service.name}
              </Popup>
            </Marker>
          )
        )}

        {/* ====================================================
            🆕 MARCADOR DEL USUARIO (Fase 2)
            Solo se dibuja si userPosition fue pasado como prop.
            ==================================================== */}

        {userPosition && (
          <>
            <Marker
              position={[userPosition.lat, userPosition.lng]}
              icon={userIcon}
            >
              <Popup>Tu ubicación</Popup>
            </Marker>

            {userPosition.accuracy && (
              <Circle
                center={[userPosition.lat, userPosition.lng]}
                radius={userPosition.accuracy}
                pathOptions={{ color: '#3b82f6', fillOpacity: 0.1 }}
              />
            )}
          </>
        )}

        {/* ====================================================
            AJUSTAR MAPA A LOS MARKERS
            ==================================================== */}

        <SyncMapViewport
          positions={positions}
          userPosition={userPosition}
          layoutKey={layoutKey}
        />

      </MapContainer>

    </Card>
  );
}
