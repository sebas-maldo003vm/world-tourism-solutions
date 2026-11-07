import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Columns2, LayoutList, Map, type LucideIcon } from 'lucide-react';
import { ServiceCard } from '@/shared/components/catalog/ServiceCard';
import {
  DEFAULT_FILTERS,
  FilterBar,
  matchesCatalogFilters,
  type Filters,
} from '@/shared/components/catalog/FilterBar';
import { MapView } from '@/shared/components/catalog/MapView';
import { LocationButton } from '@/shared/components/catalog/LocationButton';
import { ManualLocationDialog } from '@/shared/components/catalog/ManualLocationDialog';
import {
  UserLocationBar,
  type LocationSource,
} from '@/shared/components/catalog/UserLocationBar';

import type { UserCoords } from '@/shared/hooks/useGeolocation';
import { api } from '@/core/api/client';
import { trackEvent, trackEventBatch } from '@/core/analytics/trackEvent';

type ViewMode = 'split' | 'list' | 'map';

const DESKTOP_QUERY = '(min-width: 1024px)';
const SEARCH_DEBOUNCE_MS = 600;
const MAX_SEARCH_ATTRIBUTION = 40;
//const [viewMode, setViewMode] = useState<ViewMode>(resolveInitialViewMode);

const VIEW_OPTIONS: { id: ViewMode; label: string; icon: LucideIcon }[] = [
  { id: 'split', label: 'Dividida', icon: Columns2 },
  { id: 'list', label: 'Solo lista', icon: LayoutList },
  { id: 'map', label: 'Solo mapa', icon: Map },
];

function resolveInitialViewMode(): ViewMode {
  if (typeof window === 'undefined') return 'split';

  const saved = sessionStorage.getItem('catalog-view-mode');

  if (saved === 'split' || saved === 'list' || saved === 'map') {
    return saved;
  }

  return window.matchMedia(DESKTOP_QUERY).matches ? 'split' : 'list';
}

interface Service {
  id: number;
  providerId?: number;
  providerUserId?: number;
  businessName?: string;
  title?: string;
  description?: string;
  category?: 'Restaurantes' | 'Actividades' | 'Hospedaje';
  price?: number;
  avgRating?: number;
  city?: string;
  location?: string;
  latitude?: number | string;
  longitude?: number | string;
  imageUrl?: string;
  imageUrls?: string[];
  images?: string[];
}

function getServiceName(service: Service) {
  return service.businessName || service.title || 'Servicio';
}

function getServiceLocation(service: Service) {
  return [service.city, service.location].filter(Boolean).join(', ') || 'Sin ubicación';
}

function CatalogViewToggle({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  return (
    <div
    
      role="tablist"
      aria-label="Modo de visualización"
      className="hidden items-center rounded-full border border-gray-200 bg-white p-1 shadow-sm lg:inline-flex"
    >
      {VIEW_OPTIONS.map((option) => {
        const active = value === option.id;
        const Icon = option.icon;

        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.id)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Icon className="h-4 w-4" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function HomeUsuarioLogueado() {
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState<ViewMode>(resolveInitialViewMode);
  const [userPosition, setUserPosition] = useState<UserCoords | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [locationSource, setLocationSource] = useState<LocationSource | null>(null);
  const [manualPickerOpen, setManualPickerOpen] = useState(false);

  // Conservar la vista seleccionada al actualizar la página.
  useEffect(() => {
    sessionStorage.setItem('catalog-view-mode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_QUERY);

    const syncMobileDefault = () => {
      if (!media.matches) {
        setViewMode((current) =>
          current === 'split' ? 'list' : current
        );
      }
    };

    media.addEventListener('change', syncMobileDefault);
    return () => media.removeEventListener('change', syncMobileDefault);
  }, []);

  //useEffect(() => {
   // loadServices();
  //}, []);

  //const loadServices = async () => {
   // try {
    //  const response = await api.get('/businesses');

    //  setServices(Array.isArray(response.data) ? response.data : [response.data]);
    //} catch (error) {
     // console.error(error);
    //  alert('Error cargando servicios');
   // } finally {
   //   setLoading(false);
   // }
  //};
// Cercanía: el cliente solo envía origen y radio; PostgreSQL resuelve ST_DWithin.
  const originLat = filters.origin?.lat ?? null;
  const originLng = filters.origin?.lng ?? null;
  const radiusKm = filters.radiusKm;
  const proximityActive =
    originLat != null && originLng != null && radiusKm != null;

  useEffect(() => {
    let cancelled = false;

    const loadServices = async () => {
      try {
        setLoading(true);

        const response = await api.get('/businesses', {
          params: proximityActive
            ? { lat: originLat, lng: originLng, radiusKm }
            : undefined,
        });

        if (cancelled) return;

        setServices(Array.isArray(response.data) ? response.data : [response.data]);
      } catch (error) {
        if (cancelled) return;
        console.error(error);
        alert('Error cargando servicios');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadServices();

    return () => {
      cancelled = true;
    };
  }, [proximityActive, originLat, originLng, radiusKm]);

  // El radio ya lo aplicó el backend: se neutraliza aquí para no duplicar Haversine.
  const clientFilters = useMemo<Filters>(
    () => ({ ...filters, origin: null, radiusKm: null }),
    [filters],
  );



  const categories = Array.from(
    new Set(services.map((service) => service.category).filter(Boolean) as string[]),
  );

  const locations = Array.from(
    new Set(
      services
        .map((service) => service.city || service.location)
        .filter(Boolean) as string[],
    ),
  );

  const filteredServices = useMemo(
    () =>
      services.filter((service) =>
        matchesCatalogFilters(
          {
            name: getServiceName(service),
            description: service.description,
            category: service.category,
            city: service.city,
            location: service.location,
            price: service.price,
            avgRating: service.avgRating,
            latitude: service.latitude,
            longitude: service.longitude,
          },
          clientFilters,
        ),
      ),
    [services, clientFilters],
  );

  // SEARCH con debounce: un solo lote atribuido a proveedores que coinciden con la query.
  useEffect(() => {
    const query = filters.search?.trim();
    if (!query) return;

    const timeoutId = setTimeout(() => {
      const needle = query.toLowerCase();
      const providerIds = services
        .filter((service) => {
          const name = getServiceName(service).toLowerCase();
          const description = (service.description || '').toLowerCase();
          const location = getServiceLocation(service).toLowerCase();
          return (
            name.includes(needle) ||
            description.includes(needle) ||
            location.includes(needle)
          );
        })
        .map((service) => Number(service.id))
        .filter((id) => Number.isFinite(id) && id > 0)
        .slice(0, MAX_SEARCH_ATTRIBUTION);

      if (providerIds.length === 0) return;

      trackEventBatch(
        providerIds.map((providerProfileId) => ({
          eventType: 'SEARCH',
          providerProfileId,
          searchQuery: query,
        })),
      );
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [filters.search, services]);

  const mapServices = useMemo(
    () =>
      filteredServices.map((service) => ({
        id: service.id.toString(),
        name: getServiceName(service),
        location: getServiceLocation(service),
        image: service.imageUrl || '',
        price: service.price || 0,
        latitude: service.latitude,
        longitude: service.longitude,
      })),
    [filteredServices],
  );

// Callback ESTABLE (sin dependencias): LocationButton lo usa en un useEffect y,
  // si cambiara de identidad, volvería a emitir la posición GPS y pisaría la manual.
  const handleDeviceLocation = useCallback((pos: UserCoords | null) => {
    setUserPosition(pos);
    setLocationSource(pos ? 'gps' : null);
  }, []);

  const handleManualLocation = useCallback((point: { lat: number; lng: number }) => {
    setUserPosition({ lat: point.lat, lng: point.lng, accuracy: 0 });
    setLocationSource('manual');
    // Si el filtro de cercanía ya está activo, mueve su origen para no dejar resultados obsoletos.
    setFilters((current) =>
      current.radiusKm != null
        ? { ...current, origin: { lat: point.lat, lng: point.lng } }
        : current,
    );
    setManualPickerOpen(false);
  }, []);

  const handleClearLocation = useCallback(() => {
    setUserPosition(null);
    setLocationSource(null);
    setFilters((current) =>
      current.radiusKm != null || current.origin != null
        ? { ...current, origin: null, radiusKm: null }
        : current,
    );
  }, []);

  const openManualPicker = useCallback(() => setManualPickerOpen(true), []);
  const closeManualPicker = useCallback(() => setManualPickerOpen(false), []);

  // Memoizado: MapView re-encuadra el mapa cada vez que cambia la identidad de userPosition.
  // accuracy = undefined en manual evita dibujar el círculo y el "0" suelto de
  // `{userPosition.accuracy && (...)}` en MapView.
  const mapUserPosition = useMemo(
    () =>
      userPosition
        ? {
            lat: userPosition.lat,
            lng: userPosition.lng,
            accuracy: locationSource === 'gps' ? userPosition.accuracy : undefined,
          }
        : null,
    [userPosition, locationSource],
  );

  const showList = viewMode !== 'map';
  const showMap = viewMode !== 'list';
  const showingMapOnMobile = viewMode === 'map';

  const handleMapServiceClick = (service: { id: string }) => {
    const providerProfileId = Number(service.id);
    if (Number.isFinite(providerProfileId) && providerProfileId > 0) {
      trackEvent({ eventType: 'CLICK', providerProfileId });
    }
    navigate(`/booking/${service.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <FilterBar
        filters={filters}
        categories={categories}
        locations={locations}
        onFilterChange={setFilters}
        userPosition={userPosition}
       // onUserPositionChange={setUserPosition}
       onUserPositionChange={handleDeviceLocation}
      onRequestManualLocation={openManualPicker}
      />

      <div
        className={`mx-auto px-4 py-6 sm:px-6 lg:px-8 ${
          viewMode === 'map' ? 'max-w-none' : 'max-w-7xl'
        } ${showingMapOnMobile ? 'pb-24' : 'pb-28 lg:pb-6'}`}
      >
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Explora experiencias únicas</h2>
            <p className="mt-1 text-gray-600">
              {filteredServices.length} resultados encontrados
            </p>
          </div>

          <CatalogViewToggle value={viewMode} onChange={setViewMode} />
        </div>
 <UserLocationBar
          position={userPosition}
          source={locationSource}
          onPickManual={openManualPicker}
          onClear={handleClearLocation}
        />


        <div className={showList && showMap ? 'flex gap-6' : undefined}>
          {showList && (
            <div className={viewMode === 'split' ? 'min-w-0 flex-1' : 'w-full'}>
              {loading ? (
                <p>Cargando...</p>
              ) : (
                <div
                  className={
                    viewMode === 'list'
                      ? 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                      : 'grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3'
                  }
                >
                  {filteredServices.map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={{
                        id: service.id.toString(),
                        // ProviderResponse.id = ProviderProfile.id (lo que exige startConversation)                       <LocationButton onLocationChange={setUserPosition} />

                        providerId: service.id,
                        name: getServiceName(service),
                        description: service.description || '',
                        category: service.category || 'Actividades',
                        price: service.price || 0,
                        rating: service.avgRating || 0,
                        location: getServiceLocation(service),
                        image: service.imageUrl || '',
                        imageUrls: service.imageUrls?.length
                          ? service.imageUrls
                          : service.images,
                        lat: 0,
                        lng: 0,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {showMap && (
            <div
              className={
                viewMode === 'map'
                  ? 'w-full'
                  : 'hidden w-full lg:block lg:w-[400px] xl:w-[500px]'
              }
            >
              <div className={viewMode === 'map' ? undefined : 'sticky top-32'}>
                <div className="mb-3">
                <LocationButton
                    onLocationChange={handleDeviceLocation}
                    onManualSelect={openManualPicker}
                  />
                </div>

                <div
                  className={
                    viewMode === 'map'
                      ? 'h-[calc(100vh-16rem)] min-h-[24rem]'
                      : 'h-[calc(100vh-13rem)]'
                  }
                >
                  <MapView
                    layoutKey={viewMode}
                    services={mapServices}
                    onServiceClick={handleMapServiceClick}
                    //userPosition={userPosition}
                    userPosition={mapUserPosition}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
        className="fixed bottom-6 left-1/2 z-40 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-blue-700 lg:hidden"
      >
        {viewMode === 'map' ? 'Ver lista 📄' : 'Ver mapa 🗺️'}
      </button>
      <ManualLocationDialog
        open={manualPickerOpen}
        initialPosition={userPosition ? { lat: userPosition.lat, lng: userPosition.lng } : null}
        onClose={closeManualPicker}
        onConfirm={handleManualLocation}
      />
    </div>
  );
}
