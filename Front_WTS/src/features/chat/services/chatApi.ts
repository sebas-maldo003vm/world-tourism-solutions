import { api } from '@/core/api/client';

export type ConversationType =
  | 'CLIENT_TO_PROVIDER'
  | 'CLIENT_TO_SUPPORT'
  | 'PROVIDER_TO_SUPPORT';

export type SupportStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export type SupportUrgency = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ConversationItem {
  id: number;
  displayName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  conversationType: ConversationType;
  supportStatus?: SupportStatus;
  urgency?: SupportUrgency;
  otherParticipantId?: number;
  otherParticipantName?: string;
  serviceId?: number;
  serviceName?: string;
}

export interface ChatMessage {
  id: number;
  senderId: number;
  senderName: string;
  content: string;
  sentAt: string;
  isRead: boolean;
  isOwn: boolean;
}

export interface SupportTicket {
  id: number;
  userName: string;
  serviceName: string;
  urgency: SupportUrgency;
  message: string;
  createdAt: string;
  status: SupportStatus;
  conversationType: ConversationType;
}

export interface StartConversationPayload {
  providerId: number;
  serviceId?: number;
  initialMessage?: string;
}

export interface CreateSupportTicketPayload {
  message: string;
  serviceName?: string;
  urgency?: SupportUrgency;
}

export const chatApi = {
  listConversations: () => api.get<ConversationItem[]>('/chat/conversations'),

  startConversation: (payload: StartConversationPayload) =>
    api.post<ConversationItem>('/chat/conversations', payload),

  getMessages: (conversationId: number) =>
    api.get<ChatMessage[]>(`/chat/conversations/${conversationId}/messages`),

  sendMessage: (conversationId: number, content: string) =>
    api.post<ChatMessage>(`/chat/conversations/${conversationId}/messages`, { content }),

  markRead: (conversationId: number) =>
    api.patch(`/chat/conversations/${conversationId}/read`),

  createSupportTicket: (payload: CreateSupportTicketPayload) =>
    api.post<SupportTicket>('/chat/support', payload),

  listSupportTickets: () => api.get<SupportTicket[]>('/chat/support'),

  updateSupportStatus: (conversationId: number, status: SupportStatus) =>
    api.patch<SupportTicket>(`/chat/support/${conversationId}/status`, { status }),

  replySupportTicket: (conversationId: number, content: string) =>
    api.post<ChatMessage>(`/chat/support/${conversationId}/messages`, { content }),
};
