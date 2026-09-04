import { api } from '@/core/api/client';

export type ConversationType =
  | 'CLIENT_TO_PROVIDER'
  | 'CATALOG_INQUIRY'
  | 'HUMAN_SUPPORT'
  | 'CLIENT_TO_SUPPORT'
  | 'PROVIDER_TO_SUPPORT';

export type SupportStatus =
  | 'UNASSIGNED'
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'NEEDS_HUMAN_SUPPORT'
  | 'RESOLVED'
  | 'CLOSED';

export type SupportUrgency = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ConversationItem {
  id: number;
  createdAt?: string;
  displayName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  conversationType: ConversationType;
  supportStatus?: SupportStatus;
  urgency?: SupportUrgency;
  subject?: string;
  assignedAdvisorId?: number;
  assignedAdvisorName?: string;
  otherParticipantId?: number;
  otherParticipantName?: string;
  otherParticipantAvatarUrl?: string;
  clientId?: number;
  clientName?: string;
  clientAvatarUrl?: string;
  /** Alias de providerProfileId (perfil del proveedor). */
  providerId?: number;
  providerProfileId?: number;
  providerProfileName?: string;
  businessName?: string;
  logoUrl?: string;
  category?: string;
  city?: string;
}

export interface ChatMessage {
  id: number;
  conversationId?: number;
  senderId: number;
  senderName: string;
  content: string;
  imageUrl?: string | null;
  sentAt: string;
  isRead: boolean;
  isOwn: boolean;
}

export interface SupportTicket {
  id: number;
  userName: string;
  subject: string;
  urgency: SupportUrgency;
  message: string;
  createdAt: string;
  status: SupportStatus;
  conversationType: ConversationType;
  assignedAdvisorId?: number | null;
  assignedAdvisorName?: string | null;
}

export interface ChatBotSuggestion {
  type: 'FAQ' | 'SERVICE' | 'BUSINESS' | string;
  title: string;
  description: string;
  entityId?: number | null;
}

export interface ChatBotMessageResponse {
  conversationId: number;
  sessionStatus: SupportStatus;
  automated: boolean;
  reply: string;
  suggestions: ChatBotSuggestion[];
  userMessage: ChatMessage;
  botMessage: ChatMessage;
}

export interface StartConversationPayload {
  providerProfileId: number;
  initialMessage?: string;
}

export interface StartClientConversationPayload {
  clientUserId: number;
  providerProfileId?: number;
  initialMessage?: string;
}

export interface CreateSupportTicketPayload {
  message: string;
  serviceName?: string;
  urgency?: SupportUrgency;
}

/** Cabecera Authorization cuando hay sesión activa en localStorage. */
function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const chatApi = {
  /** Asistente virtual híbrido: FAQ/catálogo o escalado a humano */
  sendBotMessage: (content: string, conversationId?: number) =>
    api.post<ChatBotMessageResponse>(
      '/chat/message',
      {
        content,
        conversationId: conversationId ?? null,
      },
      { headers: authHeaders() },
    ),

  listActiveTickets: () =>
    api.get<SupportTicket[]>('/chat/tickets/active', { headers: authHeaders() }),

  replyActiveTicket: (ticketId: number, content: string) =>
    api.post<ChatMessage>(
      `/chat/tickets/${ticketId}/reply`,
      { content },
      { headers: authHeaders() },
    ),

  listConversations: () =>
    api.get<ConversationItem[]>('/chat/conversations', { headers: authHeaders() }),

  startConversation: (payload: StartConversationPayload) =>
    api.post<ConversationItem>('/chat/conversations', payload, {
      headers: authHeaders(),
    }),

  startClientConversation: (payload: StartClientConversationPayload) =>
    api.post<ConversationItem>('/chat/conversations/with-client', payload, {
      headers: authHeaders(),
    }),

  getMessages: (conversationId: number) =>
    api.get<ChatMessage[]>(`/chat/conversations/${conversationId}/messages`, {
      headers: authHeaders(),
    }),

  sendMessage: (conversationId: number, content: string) =>
    api.post<ChatMessage>(
      `/chat/conversations/${conversationId}/messages`,
      { content },
      { headers: authHeaders() },
    ),

  markRead: (conversationId: number) =>
    api.patch(`/chat/conversations/${conversationId}/read`, undefined, {
      headers: authHeaders(),
    }),

  createSupportTicket: (payload: CreateSupportTicketPayload) =>
    api.post<SupportTicket>('/chat/support', payload, { headers: authHeaders() }),

  listSupportTickets: () =>
    api.get<SupportTicket[]>('/chat/support', { headers: authHeaders() }),

  updateSupportStatus: (conversationId: number, status: SupportStatus) =>
    api.patch<SupportTicket>(
      `/chat/support/${conversationId}/status`,
      { status },
      { headers: authHeaders() },
    ),

  replySupportTicket: (conversationId: number, content: string) =>
    api.post<ChatMessage>(
      `/chat/support/${conversationId}/messages`,
      { content },
      { headers: authHeaders() },
    ),
};
