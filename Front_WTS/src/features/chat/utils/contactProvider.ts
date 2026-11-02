import type { NavigateFunction } from 'react-router-dom';

export type ContactProviderContext = {
  serviceId?: string | number | null;
  serviceName?: string | null;
  providerName?: string | null;
};

/**
 * Abre el chat con un negocio sin persistirlo.
 * El hilo solo se crea en BD cuando el cliente envía el primer mensaje.
 */
export function contactProvider(
  navigate: NavigateFunction,
  providerProfileId: number,
  context?: ContactProviderContext,
): void {
  const token = localStorage.getItem('token');
  if (!token) {
    navigate('/login');
    return;
  }

  const serviceId = context?.serviceId;
  const serviceName = context?.serviceName?.trim();
  const providerName = context?.providerName?.trim();

  const query = [
    `providerId=${encodeURIComponent(String(providerProfileId))}`,
    serviceId != null && String(serviceId).trim() !== ''
      ? `serviceId=${encodeURIComponent(String(serviceId))}`
      : null,
    serviceName ? `serviceName=${encodeURIComponent(serviceName)}` : null,
    providerName ? `providerName=${encodeURIComponent(providerName)}` : null,
  ]
    .filter(Boolean)
    .join('&');

  navigate(`/messages?${query}`);
}
