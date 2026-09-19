import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, SlidersHorizontal, Star, Tag, Wallet, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Slider } from '@/shared/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { useGeolocation } from '@/shared/hooks/useGeolocation';
import {
  buildCategoryOptions,
  clearDrawerFilters,
  DEFAULT_RADIUS_KM,
  PRICE_SLIDER_MAX,
  RADIUS_MAX_KM,
  RADIUS_MIN_KM,
  RATING_OPTIONS,
  type Filters,
  type GeoPoint,
} from './catalogFilters';

const priceFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

interface FilterDrawerProps {
  open: boolean;
  filters: Filters;
  categories: string[];
  locations: string[];
  userPosition?: GeoPoint | null;
  onClose: () => void;
  onApply: (filters: Filters) => void;
  onUserPositionChange?: (position: GeoPoint & { accuracy: number }) => void;
}

export function FilterDrawer({
  open,
  filters,
  categories,
  locations,
  userPosition,
  onClose,
  onApply,
  onUserPositionChange,
}: FilterDrawerProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [draft, setDraft] = useState<Filters>(filters);
  const wasOpen = useRef(false);
  const onUserPositionChangeRef = useRef(onUserPositionChange);
  const { status, position, errorMessage, requestLocation, reset } =
    useGeolocation();

  onUserPositionChangeRef.current = onUserPositionChange;

  const categoryOptions = buildCategoryOptions(categories);

  useEffect(() => {
    if (open && !wasOpen.current) {
      setDraft(filters);
      reset();
    }

    wasOpen.current = open;
  }, [open, filters, reset]);

  useEffect(() => {
    if (!open) {
      setVisible(false);
      const timeout = window.setTimeout(() => setMounted(false), 300);
      return () => window.clearTimeout(timeout);
    }

    setMounted(true);
    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setVisible(true));
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }

      const selectOpen = document.querySelector(
        '[data-slot="select-content"][data-state="open"]',
      );

      if (selectOpen) {
        return;
      }

      onClose();
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!visible || !panelRef.current) {
      return;
    }

    const panel = panelRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusable = () =>
      Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hasAttribute('disabled'));

    focusable()[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') {
        return;
      }

      const items = focusable();
      if (items.length === 0) {
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    panel.addEventListener('keydown', onKeyDown);

    return () => {
      panel.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus();
    };
  }, [visible]);

  useEffect(() => {
    if (status !== 'success' || !position) {
      return;
    }

    setDraft((current) => ({
      ...current,
      origin: { lat: position.lat, lng: position.lng },
      radiusKm: current.radiusKm ?? DEFAULT_RADIUS_KM,
    }));
    onUserPositionChangeRef.current?.(position);
  }, [status, position]);

  const updateDraft = (patch: Partial<Filters>) => {
    setDraft((current) => ({ ...current, ...patch }));
  };

  const toggleCategory = (value: string) => {
    setDraft((current) => {
      const selected = current.categories.some(
        (category) => category.toUpperCase() === value,
      );

      return {
        ...current,
        categories: selected
          ? current.categories.filter(
              (category) => category.toUpperCase() !== value,
            )
          : [...current.categories, value],
      };
    });
  };

  const enableProximity = () => {
    if (userPosition) {
      updateDraft({
        origin: userPosition,
        radiusKm: draft.radiusKm ?? DEFAULT_RADIUS_KM,
      });
      return;
    }

    requestLocation();
  };

  const disableProximity = () => {
    updateDraft({ origin: null, radiusKm: null });
    reset();
  };

  const handlePriceSlider = (value: number[]) => {
    const [min, max] = value;
    updateDraft({
      priceMin: min <= 0 ? null : min,
      priceMax: max >= PRICE_SLIDER_MAX ? null : max,
    });
  };

  const handlePriceInput = (field: 'priceMin' | 'priceMax', raw: string) => {
    if (raw === '') {
      updateDraft({ [field]: null });
      return;
    }

    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed >= 0) {
      updateDraft({ [field]: parsed });
    }
  };

  const handleApply = () => {
    let next = { ...draft, search: filters.search };

    if (next.priceMin != null && next.priceMax != null && next.priceMin > next.priceMax) {
      next = {
        ...next,
        priceMin: next.priceMax,
        priceMax: next.priceMin,
      };
    }

    if (next.radiusKm != null && !next.origin) {
      next = { ...next, radiusKm: null };
    }

    onApply(next);
    onClose();
  };

  const proximityEnabled = draft.origin != null && draft.radiusKm != null;
  const radiusValue = draft.radiusKm ?? DEFAULT_RADIUS_KM;
  const boundedMin = Math.min(draft.priceMin ?? 0, PRICE_SLIDER_MAX);
  const boundedMax = Math.min(draft.priceMax ?? PRICE_SLIDER_MAX, PRICE_SLIDER_MAX);
  const sliderPrice: [number, number] =
    boundedMin <= boundedMax
      ? [boundedMin, boundedMax]
      : [boundedMax, boundedMin];

  if (!mounted) {
    return null;
  }

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Cerrar filtros"
        aria-hidden={!visible}
        tabIndex={-1}
        onClick={onClose}
        className={`fixed inset-0 z-[9998] bg-black/50 transition-opacity duration-300 motion-reduce:transition-none ${
          visible ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        ref={panelRef}
        id="catalog-filter-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-hidden={!visible}
        className={`fixed inset-y-0 right-0 z-[9999] flex w-full flex-col bg-white shadow-xl transition-transform duration-300 ease-out motion-reduce:transition-none sm:w-96 ${
          visible ? 'translate-x-0' : 'pointer-events-none translate-x-full'
        }`}
      >
        <header className="flex shrink-0 items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-blue-600" />
            <h2 id={titleId} className="text-lg font-semibold">
              Filtros de búsqueda
            </h2>
          </div>
          <Button
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

        <div className="flex-1 space-y-8 overflow-y-auto overscroll-contain px-5 py-5">
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-semibold">Ubicación / Cercanía</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-location">Ciudad / Ubicación</Label>
              <Select
                value={draft.location}
                onValueChange={(value) => updateDraft({ location: value })}
              >
                <SelectTrigger id="filter-location" className="w-full rounded-xl">
                  <SelectValue placeholder="Todas las ubicaciones" />
                </SelectTrigger>
                <SelectContent className="z-[10000]">
                  <SelectItem value="all">Todas las ubicaciones</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 rounded-xl border border-gray-200 p-3">
              {proximityEnabled ? (
                <>
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">
                        A menos de: {radiusValue} km
                      </p>
                      <p className="text-xs text-gray-500">de mi ubicación</p>
                    </div>
                    <label className="sr-only" htmlFor="filter-radius">
                      Distancia máxima en kilómetros
                    </label>
                    <div className="flex items-center gap-1">
                      <Input
                        id="filter-radius"
                        type="number"
                        min={RADIUS_MIN_KM}
                        max={RADIUS_MAX_KM}
                        value={radiusValue}
                        onChange={(event) => {
                          const parsed = Number(event.target.value);
                          if (!Number.isFinite(parsed)) {
                            return;
                          }
                          updateDraft({
                            radiusKm: Math.min(
                              RADIUS_MAX_KM,
                              Math.max(RADIUS_MIN_KM, parsed),
                            ),
                          });
                        }}
                        className="h-8 w-16 rounded-lg px-2 text-center"
                      />
                      <span className="text-sm text-gray-500">km</span>
                    </div>
                  </div>

                  <Slider
                    min={RADIUS_MIN_KM}
                    max={RADIUS_MAX_KM}
                    step={1}
                    value={[radiusValue]}
                    onValueChange={(value) =>
                      updateDraft({ radiusKm: value[0] ?? DEFAULT_RADIUS_KM })
                    }
                    aria-label="Distancia máxima en kilómetros"
                  />

                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{RADIUS_MIN_KM} km</span>
                    <span>{RADIUS_MAX_KM} km</span>
                  </div>

                  <p className="text-xs text-gray-500">
                    Los servicios sin coordenadas no se incluyen en este filtro.
                  </p>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={disableProximity}
                    className="h-8 px-2 text-sm text-gray-600"
                  >
                    Quitar filtro de distancia
                  </Button>
                </>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Limita los resultados a una distancia de tu posición.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={enableProximity}
                    disabled={status === 'loading'}
                    className="w-full rounded-full"
                  >
                    <MapPin className="h-4 w-4" />
                    {status === 'loading'
                      ? 'Buscando tu ubicación...'
                      : 'Usar mi ubicación'}
                  </Button>
                  {errorMessage && (
                    <p className="text-sm text-red-600">{errorMessage}</p>
                  )}
                </div>
              )}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-semibold">Categorías</h3>
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Categorías">
              {categoryOptions.map((option) => {
                const selected = draft.categories.some(
                  (category) => category.toUpperCase() === option.value,
                );

                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleCategory(option.value)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      selected
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-semibold">Rango de precios</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="filter-price-min">Mínimo</Label>
                <Input
                  id="filter-price-min"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  placeholder="Sin mínimo"
                  value={draft.priceMin ?? ''}
                  onChange={(event) =>
                    handlePriceInput('priceMin', event.target.value)
                  }
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="filter-price-max">Máximo</Label>
                <Input
                  id="filter-price-max"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  placeholder="Sin máximo"
                  value={draft.priceMax ?? ''}
                  onChange={(event) =>
                    handlePriceInput('priceMax', event.target.value)
                  }
                  className="rounded-xl"
                />
              </div>
            </div>

            <Slider
              min={0}
              max={PRICE_SLIDER_MAX}
              step={5000}
              value={sliderPrice}
              onValueChange={handlePriceSlider}
              aria-label="Rango de precios"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{priceFormatter.format(sliderPrice[0])}</span>
              <span>
                {draft.priceMax == null
                  ? 'Sin máximo'
                  : priceFormatter.format(draft.priceMax)}
              </span>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-semibold">Calificación</h3>
            </div>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Calificación mínima">
              {RATING_OPTIONS.map((option) => {
                const selected = draft.minRating === option.value;

                return (
                  <button
                    key={option.label}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => updateDraft({ minRating: option.value })}
                    className={`rounded-xl border px-3 py-2 text-sm transition-colors ${
                      selected
                        ? 'border-blue-600 bg-blue-50 font-medium text-blue-700'
                        : 'border-gray-200 text-gray-700 hover:border-blue-300'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <footer className="flex shrink-0 gap-3 border-t bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const cleared = clearDrawerFilters(filters);
              setDraft(cleared);
              onApply(cleared);
            }}
            className="flex-1 rounded-full"
          >
            Limpiar filtros
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            className="flex-1 rounded-full bg-blue-600 text-white hover:bg-blue-700"
          >
            Aplicar filtros
          </Button>
        </footer>
      </aside>
    </>,
    document.body,
  );
}
