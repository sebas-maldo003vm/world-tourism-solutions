import { API_ORIGIN } from '@/core/api/client';
import type { ConversationItem, ConversationType } from '@/features/chat/services/chatApi';

const BOT_SUBJECT = 'Asistente Virtual';

export function resolveMediaUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  return `${API_ORIGIN}${url}`;
}

export function isSupportType(type: ConversationItem['conversationType']) {
  return (
    type === 'CLIENT_TO_SUPPORT' ||
    type === 'PROVIDER_TO_SUPPORT' ||
    type === 'HUMAN_SUPPORT'
  );
}

/** Sesión del asistente virtual (sin flag is_bot_chat en el esquema). */
export function isBotConversation(conv: ConversationItem): boolean {
  if (conv.conversationType === 'CATALOG_INQUIRY') return true;
  const subject = conv.subject?.trim();
  return subject === BOT_SUBJECT || Boolean(subject?.includes(BOT_SUBJECT));
}

/** Chat comercial directo con proveedor humano (nunca bot). */
export function isDirectProviderChat(conv: ConversationItem): boolean {
  if (isBotConversation(conv)) return false;
  if (conv.conversationType === 'CLIENT_TO_PROVIDER') return true;
  const providerId = conv.providerId ?? conv.providerProfileId;
  return providerId != null && !isSupportType(conv.conversationType);
}

export function isHumanSupportChat(conv: ConversationItem): boolean {
  return isSupportType(conv.conversationType) && !isBotConversation(conv);
}

export function isCatalogInquiry(type: ConversationType): boolean {
  return type === 'CATALOG_INQUIRY';
}

/** Avatar de la contraparte según rol del visor. */
export function counterpartyAvatarUrl(
  conv: ConversationItem,
  viewerRole?: string | null,
): string | null {
  const isStaff = viewerRole === 'ADMIN' || viewerRole === 'SUPPORT';
  if (isStaff && conv.conversationType === 'CLIENT_TO_PROVIDER') {
    return resolveMediaUrl(conv.clientAvatarUrl);
  }
  if (viewerRole === 'PROVIDER' || isStaff) {
    return resolveMediaUrl(
      conv.otherParticipantAvatarUrl || conv.clientAvatarUrl || conv.logoUrl,
    );
  }
  // USER/CUSTOMER → logo del ProviderProfile
  return resolveMediaUrl(conv.otherParticipantAvatarUrl || conv.logoUrl);
}

/** Logo del negocio (ProviderProfile) — útil en vista staff dual. */
export function providerAvatarUrl(conv: ConversationItem): string | null {
  return resolveMediaUrl(conv.logoUrl);
}

/** Título visible en lista y encabezado. */
export function conversationTitle(
  conv: ConversationItem,
  viewerRole?: string | null,
): string {
  if (isBotConversation(conv)) return BOT_SUBJECT;

  const isStaff = viewerRole === 'ADMIN' || viewerRole === 'SUPPORT';

  if (isStaff && conv.conversationType === 'CLIENT_TO_PROVIDER') {
    const client = conv.clientName?.trim() || conv.otherParticipantName?.trim() || 'Cliente';
    const business =
      conv.businessName?.trim() || conv.providerProfileName?.trim() || 'Proveedor';
    return `${client} · ${business}`;
  }

  if (isSupportType(conv.conversationType)) {
    if (isStaff) {
      return conv.clientName?.trim() || conv.otherParticipantName?.trim() || 'Soporte Técnico';
    }
    return 'Soporte Técnico';
  }

  if (viewerRole === 'PROVIDER') {
    return (
      conv.otherParticipantName?.trim() ||
      conv.clientName?.trim() ||
      conv.displayName?.trim() ||
      'Cliente'
    );
  }

  const fromApi = conv.displayName?.trim();
  if (fromApi && fromApi !== 'Conversación') {
    return fromApi;
  }
  return (
    conv.businessName?.trim() ||
    conv.providerProfileName?.trim() ||
    conv.otherParticipantName?.trim() ||
    fromApi ||
    'Conversación'
  );
}

const RESERVED_SUBJECTS = new Set([
  'asistente virtual',
  'soporte humano',
  'soporte general',
  'soporte técnico',
]);

/** Nombre del servicio consultado, si el hilo lo trae. */
export function inquiryServiceName(conv: ConversationItem): string | null {
  const fromField = conv.serviceName?.trim();
  if (fromField) return fromField;
  if (!isDirectProviderChat(conv)) return null;
  const subject = conv.subject?.trim();
  if (!subject || RESERVED_SUBJECTS.has(subject.toLowerCase())) return null;
  return subject;
}

export function inquirySubtitle(conv: ConversationItem): string | null {
  const name = inquiryServiceName(conv);
  return name ? `Consulta sobre: ${name}` : null;
}

/** Subtítulo: staff ve ambos; provider ve cliente; user ve negocio. */
export function conversationSubtitle(
  conv: ConversationItem,
  viewerRole?: string | null,
): string {
  const isStaff = viewerRole === 'ADMIN' || viewerRole === 'SUPPORT';
  const inquiry = inquirySubtitle(conv);

  if (isSupportType(conv.conversationType)) {
    return isStaff ? 'Ticket de soporte humano' : 'Canal de soporte';
  }

  if (isStaff && conv.conversationType === 'CLIENT_TO_PROVIDER') {
    const business =
      conv.businessName?.trim() || conv.providerProfileName?.trim() || 'Negocio';
    const parts = [business, conv.category, conv.city].filter(
      (part) => part && String(part).trim(),
    );
    return inquiry ? `${inquiry} · ${parts.join(' · ')}` : `Cliente → ${parts.join(' · ')}`;
  }

  if (viewerRole === 'PROVIDER') {
    return inquiry || 'Cliente que inició el chat';
  }

  if (inquiry) return inquiry;

  const parts = [conv.category, conv.city].filter((part) => part && part.trim());
  if (parts.length > 0) {
    return parts.join(' · ');
  }
  return 'Contacto directo con proveedor';
}

export function initialsFromName(name?: string | null): string {
  if (!name?.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}
