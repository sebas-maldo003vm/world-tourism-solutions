import { useCallback, useState } from 'react';

export type GeolocationStatus =
  | 'idle'
  | 'loading'
  | 'success'
  | 'denied'
  | 'unavailable'
  | 'timeout'
  | 'unsupported';

export interface UserCoords {
  lat: number;
  lng: number;
  accuracy: number; // radio de error en metros
}

interface GeolocationState {
  status: GeolocationStatus;
  position: UserCoords | null;
  errorMessage: string | null;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;    // ms
  maximumAge?: number; // ms - reutiliza una posición cacheada si es más reciente que esto
}

const initialState: GeolocationState = {
  status: 'idle',
  position: null,
  errorMessage: null,
};

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0,
  } = options;

  const [state, setState] = useState<GeolocationState>(initialState);

  const requestLocation = useCallback(() => {
    // Caso: navegador sin soporte para geolocalización
    if (!('geolocation' in navigator)) {
      setState({
        status: 'unsupported',
        position: null,
        errorMessage: 'Tu navegador no soporta geolocalización.',
      });
      return;
    }

    setState((prev) => ({ ...prev, status: 'loading', errorMessage: null }));

    navigator.geolocation.getCurrentPosition(
      // Caso: usuario aceptó
      (pos) => {
        setState({
          status: 'success',
          position: {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          },
          errorMessage: null,
        });
      },
      // Casos de error
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setState({
            status: 'denied',
            position: null,
            errorMessage: 'Rechazaste el acceso a tu ubicación.',
          });
        } else if (err.code === err.TIMEOUT) {
          setState({
            status: 'timeout',
            position: null,
            errorMessage: 'Tardamos demasiado en obtener tu ubicación. Intenta de nuevo.',
          });
        } else {
          // POSITION_UNAVAILABLE u otro
          setState({
            status: 'unavailable',
            position: null,
            errorMessage: 'No pudimos determinar tu ubicación en este momento.',
          });
        }
      },
      { enableHighAccuracy, timeout, maximumAge }
    );
  }, [enableHighAccuracy, timeout, maximumAge]);

  const reset = useCallback(() => setState(initialState), []);

  return { ...state, requestLocation, reset };
}
