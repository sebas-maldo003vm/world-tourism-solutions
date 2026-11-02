import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Search, Loader2 } from 'lucide-react';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const pickerIcon = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const DEFAULT_CENTER: [number, number] = [4.711, -74.0721]; // Bogotá

interface LocationPickerProps {
  latitude?: string;
  longitude?: string;
  onLocationChange: (lat: string, lng: string) => void;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

// Recentra el mapa cada vez que la posición cambia (por búsqueda o por drag)
function RecenterMap({ position }: { position: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.setView(position, map.getZoom() < 13 ? 15 : map.getZoom());
  }, [map, position]);

  return null;
}

export function LocationPicker({
  latitude,
  longitude,
  onLocationChange,
}: LocationPickerProps) {
  const initialPosition: [number, number] =
    latitude && longitude
      ? [Number(latitude), Number(longitude)]
      : DEFAULT_CENTER;

  const [position, setPosition] = useState<[number, number]>(initialPosition);
  const [addressQuery, setAddressQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Notifica al formulario padre cada vez que la posición cambia
  useEffect(() => {
    onLocationChange(String(position[0]), String(position[1]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position]);

  const handleSearch = async () => {
    if (!addressQuery.trim()) return;

    setSearching(true);
    setSearchError('');

    try {
      const url = new URL('https://nominatim.openstreetmap.org/search');
      url.searchParams.set('format', 'json');
      url.searchParams.set('q', addressQuery);
      url.searchParams.set('limit', '1');
      url.searchParams.set('countrycodes', 'co'); // sesga resultados a Colombia

      const response = await fetch(url.toString());
      const results: NominatimResult[] = await response.json();

      if (results.length === 0) {
        setSearchError('No se encontró esa dirección. Ajusta el marker manualmente.');
        return;
      }

      const result = results[0];
      setPosition([Number(result.lat), Number(result.lon)]);
    } catch (error) {
      console.error(error);
      setSearchError('Error buscando la dirección. Intenta de nuevo.');
    } finally {
      setSearching(false);
    }
  };

  const handleMarkerDragEnd = (event: L.DragEndEvent) => {
    const marker = event.target as L.Marker;
    const latLng = marker.getLatLng();
    setPosition([latLng.lat, latLng.lng]);
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>Buscar dirección</Label>
        <div className="flex gap-2 mt-1">
          <Input
            value={addressQuery}
            onChange={(e) => setAddressQuery(e.target.value)}
            placeholder="Ej: Calle 93 #11-27, Bogotá"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch();
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleSearch}
            disabled={searching}
          >
            {searching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
        {searchError && (
          <p className="text-sm text-red-600 mt-1">{searchError}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Después de buscar, puedes arrastrar el marker para ajustar la ubicación exacta.
        </p>
      </div>

      <div className="h-64 rounded-lg overflow-hidden border">
        <MapContainer
          center={position}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <Marker
            position={position}
            icon={pickerIcon}
            draggable
            eventHandlers={{
              dragend: handleMarkerDragEnd,
            }}
          />

          <RecenterMap position={position} />
        </MapContainer>
      </div>

      <p className="text-xs text-gray-500">
        Coordenadas seleccionadas: {position[0].toFixed(6)}, {position[1].toFixed(6)}
      </p>
    </div>
  );
}
