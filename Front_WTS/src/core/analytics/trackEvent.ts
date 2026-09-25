import { api } from '@/core/api/client';

export type AnalyticsEventType = 'SEARCH' | 'VIEW' | 'CLICK';

interface TrackEventParams {
  eventType: AnalyticsEventType;
  providerProfileId?: number;
  searchQuery?: string;
}

/**
 * Envía un evento de analítica al backend. Es "fire-and-forget":
 * nunca debe bloquear ni romper la experiencia del usuario si falla
 * (por eso el .catch silencioso, a propósito).
 */
export function trackEvent({ eventType, providerProfileId, searchQuery }: TrackEventParams) {
  api.post('/analytics/events', { eventType, providerProfileId, searchQuery }).catch(() => {
    // Intencional: un evento de analítica que falla no debe afectar al usuario.
  });
}
