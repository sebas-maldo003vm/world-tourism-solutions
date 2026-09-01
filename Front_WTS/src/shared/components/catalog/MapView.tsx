import { useEffect, useMemo, useRef, useState } from 'react';

import { Card } from '@/shared/components/ui/card';

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

interface MapViewProps {
  services: MapService[];
  onServiceClick?: (service: MapService) => void;
}

const GOOGLE_MAPS_SCRIPT_ID = 'google-maps-script';
const DEFAULT_CENTER = { lat: 4.711, lng: -74.0721 };

function loadGoogleMaps(apiKey: string) {
  if ((window as any).google?.maps) {
    return Promise.resolve((window as any).google);
  }

  const existingScript = document.getElementById(
    GOOGLE_MAPS_SCRIPT_ID
  ) as HTMLScriptElement | null;

  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener('load', () => {
        resolve((window as any).google);
      });
      existingScript.addEventListener('error', reject);
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve((window as any).google);
    script.onerror = reject;

    document.head.appendChild(script);
  });
}

function toNumber(value?: number | string) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : null;
}

function getServicePosition(service: MapService) {
  const lat = toNumber(service.lat ?? service.latitude);
  const lng = toNumber(service.lng ?? service.longitude);

  if (lat === null || lng === null || (lat === 0 && lng === 0)) {
    return null;
  }

  return { lat, lng };
}

export function MapView({ services, onServiceClick }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapError, setMapError] = useState('');

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

  const servicesWithPosition = useMemo(
    () =>
      services
        .map((service) => ({
          service,
          position: getServicePosition(service),
        }))
        .filter((item) => item.position),
    [services]
  );

  useEffect(() => {
    if (!apiKey) {
      setMapError('Configura VITE_GOOGLE_MAPS_API_KEY para usar Google Maps.');
      return;
    }

    let isMounted = true;

    loadGoogleMaps(apiKey)
      .then((google: any) => {
        if (!isMounted || !mapRef.current) {
          return;
        }

        const center = servicesWithPosition[0]?.position || DEFAULT_CENTER;

        if (!mapInstanceRef.current) {
          mapInstanceRef.current = new google.maps.Map(mapRef.current, {
            center,
            zoom: servicesWithPosition.length ? 12 : 6,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          });
        }

        const map = mapInstanceRef.current;
        const bounds = new google.maps.LatLngBounds();

        markersRef.current.forEach((marker) => marker.setMap(null));
        markersRef.current = [];

        servicesWithPosition.forEach(({ service, position }) => {
          const marker = new google.maps.Marker({
            position,
            map,
            title: service.name,
          });

          marker.addListener('click', () => {
            onServiceClick?.(service);
          });

          markersRef.current.push(marker);
          bounds.extend(position);
        });

        if (servicesWithPosition.length > 1) {
          map.fitBounds(bounds);
        } else if (servicesWithPosition.length === 1) {
          map.setCenter(center);
          map.setZoom(14);
        }

        setMapError('');
      })
      .catch(() => {
        if (isMounted) {
          setMapError('No se pudo cargar Google Maps.');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [apiKey, onServiceClick, servicesWithPosition]);

  return (
    <Card className="h-full overflow-hidden relative bg-gray-100">
      <div ref={mapRef} className="h-full w-full" />

      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-white p-6 text-center text-sm text-gray-600">
          {mapError}
        </div>
      )}
    </Card>
  );
}
