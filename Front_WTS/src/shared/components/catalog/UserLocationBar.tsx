import { MapPin } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

export type LocationSource = 'gps' | 'manual';

interface UserLocationBarProps {
  position: { lat: number; lng: number } | null;
  source: LocationSource | null;
  onPickManual: () => void;
  onClear: () => void;
}

export function UserLocationBar({
  position,
  source,
  onPickManual,
  onClear,
}: UserLocationBarProps) {
  const coords = position
    ? `${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}`
    : null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm">
      <MapPin className="h-4 w-4 shrink-0 text-blue-600" />

      <span className="min-w-0 flex-1 text-gray-700">
        {!position && 'Sin ubicación. Puedes explorar todos los servicios o elegir tu ubicación para filtrar por cercanía.'}
        {position && source === 'gps' && `Usando tu ubicación (GPS): ${coords}`}
        {position && source === 'manual' && `Ubicación elegida manualmente: ${coords}`}
      </span>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onPickManual}
          className="rounded-full"
        >
          {source === 'manual' ? 'Cambiar' : 'Elegir en el mapa'}
        </Button>

        {source === 'manual' && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="rounded-full text-gray-600"
          >
            Quitar
          </Button>
        )}
      </div>
    </div>
  );
}