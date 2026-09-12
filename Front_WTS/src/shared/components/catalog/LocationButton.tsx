import { useEffect } from 'react';
import { useGeolocation, type UserCoords } from '../../hooks/useGeolocation';

interface LocationButtonProps {
  onLocationChange: (pos: UserCoords | null) => void;
}

export function LocationButton({ onLocationChange }: LocationButtonProps) {
  const { status, position, errorMessage, requestLocation } = useGeolocation();

  // Cada vez que obtenemos una posición nueva, se la pasamos al componente padre
  useEffect(() => {
    if (status === 'success' && position) {
      onLocationChange(position);
    }
  }, [status, position, onLocationChange]);

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
    </div>
  );
}
