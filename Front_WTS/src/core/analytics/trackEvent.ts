import { api } from '@/core/api/client';

export type AnalyticsEventType = 'SEARCH' | 'VIEW' | 'CLICK';

export interface TrackEventParams {
  eventType: AnalyticsEventType;
  providerProfileId: number;
  searchQuery?: string;
}

const MAX_BATCH = 40;

function isValidProviderId(id: unknown): id is number {
  return typeof id === 'number' && Number.isFinite(id) && id > 0;
}

/**
 * Fire-and-forget: nunca bloquea la UI ni propaga errores al usuario.
 */
export function trackEvent({ eventType, providerProfileId, searchQuery }: TrackEventParams): void {
  if (!isValidProviderId(providerProfileId)) return;

  void api
    .post('/analytics/events', {
      eventType,
      providerProfileId,
      searchQuery: searchQuery?.trim().slice(0, 200) || undefined,
    })
    .catch(() => {
      // Intencional: la analítica no debe afectar la experiencia.
    });
}

/**
 * Envía un lote (máx. 40) en un solo request. Ideal para SEARCH atribuido
 * a varios proveedores visibles tras un filtro, sin N POSTs.
 */
export function trackEventBatch(events: TrackEventParams[]): void {
  const payload = events
    .filter((event) => isValidProviderId(event.providerProfileId))
    .slice(0, MAX_BATCH)
    .map((event) => ({
      eventType: event.eventType,
      providerProfileId: event.providerProfileId,
      searchQuery: event.searchQuery?.trim().slice(0, 200) || undefined,
    }));

  if (payload.length === 0) return;

  void api.post('/analytics/events/batch', { events: payload }).catch(() => {
    // Intencional.
  });
}

/**
 * Vista de detalle: una sola vez por proveedor y pestaña (sessionStorage).
 * Evita inflar views_count al remount/Strict Mode/refresco rápido.
 */
export function trackDetailViewOnce(providerProfileId: number): void {
  if (!isValidProviderId(providerProfileId) || typeof sessionStorage === 'undefined') {
    return;
  }

  const key = `wts:analytics:view:${providerProfileId}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
  } catch {
    // sessionStorage puede fallar en modo privado; igual enviamos el evento.
  }

  trackEvent({ eventType: 'VIEW', providerProfileId });
}
