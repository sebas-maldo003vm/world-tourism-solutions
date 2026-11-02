import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { LocationPicker } from './LocationPicker';

export interface ManualLocationPoint {
  lat: number;
  lng: number;
}

// Mismo centro por defecto que usa LocationPicker (Bogotá).
const FALLBACK_CENTER: ManualLocationPoint = { lat: 4.711, lng: -74.0721 };

interface ManualLocationDialogProps {
  open: boolean;
  initialPosition?: ManualLocationPoint | null;
  onClose: () => void;
  onConfirm: (point: ManualLocationPoint) => void;
}

export function ManualLocationDialog({
  open,
  ...rest
}: ManualLocationDialogProps) {
  if (!open) {
    return null;
  }

  // El contenido solo se monta mientras está abierto: LocationPicker lee su
  // posición inicial una única vez al montarse.
  return createPortal(<DialogContent {...rest} />, document.body);
}

function DialogContent({
  initialPosition,
  onClose,
  onConfirm,
}: Omit<ManualLocationDialogProps, 'open'>) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const [start] = useState<ManualLocationPoint>(
    () => initialPosition ?? FALLBACK_CENTER,
  );
  const [hadInitial] = useState(() => initialPosition != null);
  const [draft, setDraft] = useState<ManualLocationPoint>(start);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseRef.current();
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus();
    };
  }, []);

  const handlePick = (lat: string, lng: string) => {
    const parsedLat = Number(lat);
    const parsedLng = Number(lng);

    if (Number.isFinite(parsedLat) && Number.isFinite(parsedLng)) {
      setDraft({ lat: parsedLat, lng: parsedLng });
    }
  };

  // Evita confirmar por accidente el centro por defecto sin haber elegido nada.
  const moved = draft.lat !== start.lat || draft.lng !== start.lng;
  const canConfirm = hadInitial || moved;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        data-manual-location-dialog
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:max-w-lg sm:rounded-2xl"
      >
        <header className="flex shrink-0 items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            <h2 id={titleId} className="text-lg font-semibold">
              Elige tu ubicación
            </h2>
          </div>
          <Button
            ref={closeRef}
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          <p className="text-sm text-gray-600">
            Busca una dirección o arrastra el marcador hasta tu posición. Solo
            se usa para filtrar servicios por cercanía.
          </p>
          <LocationPicker
            latitude={String(start.lat)}
            longitude={String(start.lng)}
            onLocationChange={handlePick}
          />
        </div>

        <footer className="flex shrink-0 gap-3 border-t bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 rounded-full"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!canConfirm}
            onClick={() => onConfirm(draft)}
            className="flex-1 rounded-full bg-blue-600 text-white hover:bg-blue-700"
          >
            Confirmar ubicación
          </Button>
        </footer>
      </div>
    </div>
  );
}