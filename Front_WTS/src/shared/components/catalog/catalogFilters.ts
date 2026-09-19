export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Filters {
  search: string;
  categories: string[];
  location: string;
  /** Radio en km. Solo se aplica si también hay `origin`. */
  radiusKm: number | null;
  origin: GeoPoint | null;
  priceMin: number | null;
  priceMax: number | null;
  /** Calificación mínima (ej. 4 = 4★ o más). `null` = cualquiera. */
  minRating: number | null;
}

export interface CatalogItem {
  name?: string;
  description?: string;
  category?: string;
  city?: string;
  location?: string;
  price?: number | string | null;
  avgRating?: number | string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
}

export const DEFAULT_FILTERS: Filters = {
  search: '',
  categories: [],
  location: 'all',
  radiusKm: null,
  origin: null,
  priceMin: null,
  priceMax: null,
  minRating: null,
};

export const CATEGORY_OPTIONS = [
  { value: 'HOSPEDAJE', label: 'Hospedaje' },
  { value: 'RESTAURANTE', label: 'Restaurantes' },
  { value: 'ACTIVIDAD', label: 'Actividades' },
  { value: 'TOUR', label: 'Tours' },
  { value: 'TRANSPORTE', label: 'Transporte' },
] as const;

export const PRICE_SLIDER_MAX = 500_000;
export const RADIUS_MIN_KM = 1;
export const RADIUS_MAX_KM = 100;
export const DEFAULT_RADIUS_KM = 25;

export const RATING_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: 'Cualquiera' },
  { value: 3, label: '3★ o más' },
  { value: 4, label: '4★ o más' },
  { value: 5, label: '5★' },
];

export function categoryLabel(value: string): string {
  const known = CATEGORY_OPTIONS.find(
    (option) => option.value === value.toUpperCase(),
  );

  if (known) {
    return known.label;
  }

  const normalized = value.replace(/_/g, ' ').toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function buildCategoryOptions(categories: string[]) {
  const extras = categories
    .filter(
      (category) =>
        !CATEGORY_OPTIONS.some(
          (option) => option.value === category.toUpperCase(),
        ),
    )
    .map((category) => ({
      value: category.toUpperCase(),
      label: categoryLabel(category),
    }));

  return [...CATEGORY_OPTIONS, ...extras];
}

export function countActiveFilters(filters: Filters): number {
  let count = filters.categories.length;

  if (filters.location !== 'all') {
    count += 1;
  }

  if (filters.radiusKm != null && filters.origin) {
    count += 1;
  }

  if (filters.priceMin != null || filters.priceMax != null) {
    count += 1;
  }

  if (filters.minRating != null) {
    count += 1;
  }

  return count;
}

export function clearDrawerFilters(filters: Filters): Filters {
  return {
    ...DEFAULT_FILTERS,
    search: filters.search,
  };
}

function toNumber(value: number | string | null | undefined): number | null {
  if (value == null || value === '') {
    return null;
  }

  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Distancia en km entre dos puntos (haversine). Las coords vienen del backend. */
export function distanceKm(from: GeoPoint, to: GeoPoint): number {
  const earthRadiusKm = 6371;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);

  const haversine =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.min(1, Math.sqrt(haversine)));
}

export function matchesCatalogFilters(
  item: CatalogItem,
  filters: Filters,
): boolean {
  const search = filters.search.trim().toLowerCase();

  if (search) {
    const searchableText = [
      item.name,
      item.description,
      item.category,
      item.city,
      item.location,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    if (!searchableText.includes(search)) {
      return false;
    }
  }

  if (filters.categories.length > 0) {
    const category = (item.category ?? '').toUpperCase();
    const selected = filters.categories.some(
      (value) => value.toUpperCase() === category,
    );

    if (!selected) {
      return false;
    }
  }

  if (filters.location !== 'all') {
    const matchesLocation =
      item.city === filters.location || item.location === filters.location;

    if (!matchesLocation) {
      return false;
    }
  }

  const price = toNumber(item.price) ?? 0;

  if (filters.priceMin != null && price < filters.priceMin) {
    return false;
  }

  if (filters.priceMax != null && price > filters.priceMax) {
    return false;
  }

  if (
    filters.minRating != null &&
    (toNumber(item.avgRating) ?? 0) < filters.minRating
  ) {
    return false;
  }

  if (filters.radiusKm != null && filters.origin) {
    const lat = toNumber(item.latitude);
    const lng = toNumber(item.longitude);

    if (lat == null || lng == null) {
      return false;
    }

    if (distanceKm(filters.origin, { lat, lng }) > filters.radiusKm) {
      return false;
    }
  }

  return true;
}
