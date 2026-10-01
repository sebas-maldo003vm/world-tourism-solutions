import { trackEventBatch, type AnalyticsEventType } from '@/core/analytics/trackEvent';

/**
 * Acumulador local opcional para métricas de listado.
 * Por diseño actual NO se usa en ServiceCard: VIEW real = detalle del servicio.
 *
 * Si en el futuro se rehabilitan impresiones de catálogo, encolar IDs y flush:
 *   const batcher = createProviderIdBatcher({ eventType: 'SEARCH' });
 *   batcher.queue(id);
 *   // al salir de la vista: batcher.dispose()
 */
export function createProviderIdBatcher(options: {
  eventType: AnalyticsEventType;
  flushIntervalMs?: number;
  maxBatch?: number;
  searchQuery?: string;
}) {
  const flushIntervalMs = options.flushIntervalMs ?? 8000;
  const maxBatch = options.maxBatch ?? 40;
  const pending = new Set<number>();
  let timer: ReturnType<typeof setTimeout> | null = null;

  const flush = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (pending.size === 0) return;

    const ids = Array.from(pending).slice(0, maxBatch);
    pending.clear();

    trackEventBatch(
      ids.map((providerProfileId) => ({
        eventType: options.eventType,
        providerProfileId,
        searchQuery: options.searchQuery,
      })),
    );
  };

  const schedule = () => {
    if (timer) return;
    timer = setTimeout(flush, flushIntervalMs);
  };

  return {
    queue(providerProfileId: number) {
      if (!Number.isFinite(providerProfileId) || providerProfileId <= 0) return;
      pending.add(providerProfileId);
      if (pending.size >= maxBatch) {
        flush();
      } else {
        schedule();
      }
    },
    flush,
    dispose() {
      flush();
    },
  };
}
