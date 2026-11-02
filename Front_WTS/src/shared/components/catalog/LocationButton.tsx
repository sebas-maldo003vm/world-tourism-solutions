import { useEffect } from 'react';
import { useGeolocation, type UserCoords } from '../../hooks/useGeolocation';

interface LocationButtonProps {
  onLocationChange: (pos: UserCoords | null) => void;
  /** Opcional: ofrece elegir la ubicación a mano (p. ej. si el GPS falla). */
  onManualSelect?: () => void;
}

export function LocationButton({ onLocationChange, onManualSelect }: LocationButtonProps) {  const { status, position, errorMessage, requestLocation } = useGeolocation();

  // Cada vez que obtenemos una posición nueva, se la pasamos al componente padre
  useEffect(() => {
    if (status === 'success' && position) {
      onLocationChange(position);
    }
  }, [status, position, onLocationChange]);
const locationFailed =
    status === 'denied' ||
    status === 'timeout' ||
    status === 'unavailable' ||
    status === 'unsupported';
  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={requestLocation}
        disabled={status === 'loading'}
        className="px-3 py-2 rounded bg-blue-600 text-white text-sm disabled:opacity-50"
      >
        {status === 'loading' ? 'Buscando tu ubicación...' : '📍 Usar mi ubicación'}
      </button>

      {status === 'denied' && (
        <p className="text-sm text-red-600">
          {errorMessage} Puedes habilitar el permiso desde el ícono de candado en la barra de direcciones.
        </p>
      )}
      {status === 'timeout' && (
        <p className="text-sm text-amber-600">{errorMessage}</p>
      )}
      {status === 'unavailable' && (
        <p className="text-sm text-red-600">{errorMessage}</p>
      )}
      {status === 'unsupported' && (
        <p className="text-sm text-red-600">{errorMessage}</p>
      )}
      {onManualSelect && (
        <button
          type="button"
          onClick={onManualSelect}
          className={
            locationFailed
              ? 'px-3 py-2 rounded border border-blue-600 text-blue-700 text-sm font-medium hover:bg-blue-50'
              : 'text-left text-sm text-blue-700 underline'
          }
        >
          {locationFailed
            ? '📌 Elegir mi ubicación en el mapa'
            : 'o elegir mi ubicación manualmente'}
        </button>
      )}
    </div>
  );
}
