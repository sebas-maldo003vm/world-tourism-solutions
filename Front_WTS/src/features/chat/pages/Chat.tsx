import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Send, Paperclip, MoreVertical, ArrowLeft, Loader2, AlertCircle, Bot, Headphones } from 'lucide-react';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import {
  chatApi,
  type ChatMessage,
  type ConversationItem,
} from '@/features/chat/services/chatApi';
import { SupportTicketModal } from '@/features/chat/components/SupportTicketModal';
import {
  conversationSubtitle,
  conversationTitle,
  counterpartyAvatarUrl,
  inquirySubtitle,
  isBotConversation,
  isDirectProviderChat,
  isHumanSupportChat,
  isSupportType,
  providerAvatarUrl,
} from '@/features/chat/utils/conversationDisplay';
import { useAuth } from '@/features/auth/context/AuthContext';
import { api } from '@/core/api/client';
import { UserAvatar } from '@/shared/components/UserAvatar';

const POLL_INTERVAL_MS = 5000;
const DRAFT_CONVERSATION_ID = -1;
/** Altura del Header global (`h-16` = 4rem). */
const HEADER_HEIGHT = '4rem';

type InboxTab = 'direct' | 'support';

function inboxDescription(role: string | null, tab: InboxTab) {
  if (role === 'ADMIN' || role === 'SUPPORT') {
    return 'Cola de atención y tickets de soporte de la plataforma';
  }
  if (tab === 'support') {
    return 'Tickets de soporte con el equipo de la plataforma';
  }
  if (role === 'PROVIDER') {
    return 'Mensajes y consultas de clientes sobre tus publicaciones';
  }
  return 'Consultas y conversaciones con negocios del catálogo';
}

function formatTime(value: string) {
  return new Date(value).toLocaleString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: 'short',
  });
}

function isEphemeralConversation(conv: ConversationItem | null | undefined) {
  return Boolean(conv && (conv.ephemeral || conv.id === DRAFT_CONVERSATION_ID));
}

function toPositiveId(value: string | null) {
  if (!value) return null;
  const id = Number(value);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function readApiError(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'response' in error) {
    const message = (error as { response?: { data?: { message?: string } } }).response?.data
      ?.message;
    if (message) return message;
  }
  return fallback;
}

/** Un hilo persistido por turista y negocio. Si hay subject, se prefiere el del mismo servicio. */
function findProviderThread(
  list: ConversationItem[],
  providerId: number,
  serviceName: string,
) {
  const matches = list.filter((conv) => {
    if (!isDirectProviderChat(conv)) return false;
    return (conv.providerId ?? conv.providerProfileId) === providerId;
  });
  if (serviceName) {
    const byService = matches.find((conv) => {
      const stored = (conv.serviceName || conv.subject || '').trim();
      return stored === serviceName;
    });
    if (byService) return byService;
  }
  return matches[0] ?? null;
}

function withInquiryContext(
  conv: ConversationItem,
  serviceId: number | null,
  serviceName: string,
): ConversationItem {
  if (!serviceName && serviceId == null) return conv;
  return {
    ...conv,
    serviceId: serviceId ?? conv.serviceId,
    serviceName: serviceName || conv.serviceName,
  };
}

function buildDraftConversation(input: {
  providerId: number;
  serviceId: number | null;
  serviceName: string;
  providerName: string;
}): ConversationItem {
  const name = input.providerName.trim() || 'Proveedor';
  return {
    id: DRAFT_CONVERSATION_ID,
    ephemeral: true,
    displayName: name,
    businessName: name,
    providerProfileName: name,
    lastMessage: '',
    lastMessageAt: new Date().toISOString(),
    unreadCount: 0,
    conversationType: 'CLIENT_TO_PROVIDER',
    providerId: input.providerId,
    providerProfileId: input.providerId,
    serviceId: input.serviceId,
    serviceName: input.serviceName || null,
    subject: input.serviceName || undefined,
  };
}

function sortByLastMessage(list: ConversationItem[]) {
  return [...list].sort(
    (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
  );
}

/** Normaliza un ticket del inbox de soporte a ConversationItem para la bandeja. */
function ticketToConversationItem(ticket: {
  id: number;
  userName: string;
  subject: string;
  urgency: ConversationItem['urgency'];
  message: string;
  createdAt: string;
  status: ConversationItem['supportStatus'];
  conversationType: ConversationItem['conversationType'];
  assignedAdvisorId?: number | null;
  assignedAdvisorName?: string | null;
}): ConversationItem {
  return {
    id: ticket.id,
    displayName: ticket.userName,
    clientName: ticket.userName,
    lastMessage: ticket.message,
    lastMessageAt: ticket.createdAt,
    unreadCount: 0,
    conversationType: ticket.conversationType,
    supportStatus: ticket.status,
    urgency: ticket.urgency,
    subject: ticket.subject,
    providerProfileName: ticket.subject,
    assignedAdvisorId: ticket.assignedAdvisorId ?? undefined,
    assignedAdvisorName: ticket.assignedAdvisorName ?? undefined,
  };
}

function messageAvatarSrc(
  message: ChatMessage,
  conversation: ConversationItem | null,
  ownPictureUrl?: string | null,
) {
  if (message.isOwn) {
    return ownPictureUrl;
  }

  if (!conversation) {
    return null;
  }

  if (conversation.clientId != null && message.senderId === conversation.clientId) {
    return conversation.clientAvatarUrl;
  }

  if (
    conversation.otherParticipantId != null &&
    message.senderId === conversation.otherParticipantId
  ) {
    return conversation.otherParticipantAvatarUrl;
  }

  return conversation.logoUrl || conversation.otherParticipantAvatarUrl || null;
}

export function Chat() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const viewerRole = user?.role ?? null;
  const isAdmin = viewerRole === 'ADMIN';
  const isSupport = viewerRole === 'SUPPORT';
  const isStaff = isAdmin || isSupport;
  const isProvider = viewerRole === 'PROVIDER';
  const [directConversations, setDirectConversations] = useState<ConversationItem[]>([]);
  const [supportConversations, setSupportConversations] = useState<ConversationItem[]>([]);
  const [inboxTab, setInboxTab] = useState<InboxTab>(isStaff ? 'support' : 'direct');
  const [selectedConversation, setSelectedConversation] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const openedContactKey = useRef<string | null>(null);

  useEffect(() => {
    if (isStaff && inboxTab !== 'support') {
      setInboxTab('support');
    }
  }, [isStaff, inboxTab]);

  const visibleConversations =
    inboxTab === 'direct' ? directConversations : supportConversations;

  const loadConversations = useCallback(async () => {
    try {
      // Staff: inbox unificado de SupportController. USER/PROVIDER: bandeja comercial + tickets propios.
      if (isStaff) {
        const { data: tickets } = await chatApi.listSupportTickets();
        const supportChats = sortByLastMessage(tickets.map(ticketToConversationItem));
        setDirectConversations([]);
        setSupportConversations(supportChats);
        setError(null);
        return { providerChats: [], supportChats, all: supportChats };
      }

      const { data } = await chatApi.listConversations();
      // Aislamiento bot: nunca listar CATALOG_INQUIRY / Asistente Virtual en bandeja.
      const humanOnly = data.filter((c) => !isBotConversation(c));
      const providerChats = sortByLastMessage(humanOnly.filter(isDirectProviderChat));
      const supportChats = sortByLastMessage(humanOnly.filter(isHumanSupportChat));
      setDirectConversations(providerChats);
      setSupportConversations(supportChats);
      setError(null);
      return { providerChats, supportChats, all: humanOnly };
    } catch {
      setError('No se pudieron cargar las conversaciones.');
      return { providerChats: [], supportChats: [], all: [] };
    } finally {
      setLoading(false);
    }
  }, [isStaff]);

  const loadMessages = useCallback(async (conversationId: number) => {
    setLoadingMessages(true);
    try {
      const { data } = await chatApi.getMessages(conversationId);
      setMessages(data);
      await chatApi.markRead(conversationId);
      const clearUnread = (list: ConversationItem[]) =>
        list.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c));
      setDirectConversations(clearUnread);
      setSupportConversations(clearUnread);
    } catch {
      setError('No se pudieron cargar los mensajes.');
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedConversation?.id]);

  const discardDraft = useCallback(() => {
    setSelectedConversation((current) => (isEphemeralConversation(current) ? null : current));
    setMessages([]);
    setMessageText('');
    setShowChat(false);
    if (searchParams.get('providerId') || searchParams.get('serviceId')) {
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    let cancelled = false;

    loadConversations().then(async ({ all }) => {
      if (cancelled) return;

      const providerId = toPositiveId(searchParams.get('providerId'));
      const serviceId = toPositiveId(searchParams.get('serviceId'));
      const inquiryName = searchParams.get('serviceName')?.trim() || '';
      const providerName = searchParams.get('providerName')?.trim() || '';

      if (providerId && !isStaff) {
        const contactKey = `${providerId}|${serviceId ?? ''}|${inquiryName}`;
        if (openedContactKey.current === contactKey) {
          return;
        }
        openedContactKey.current = contactKey;
        setMessageText('');
        const existing = findProviderThread(all, providerId, inquiryName);
        if (existing) {
          setInboxTab('direct');
          setSelectedConversation(withInquiryContext(existing, serviceId, inquiryName));
          setShowChat(true);
          return;
        }

        setInboxTab('direct');
        setMessages([]);
        setSelectedConversation(
          buildDraftConversation({
            providerId,
            serviceId,
            serviceName: inquiryName,
            providerName,
          }),
        );
        setShowChat(true);

        try {
          const { data } = await api.get<{
            businessName?: string;
            logoUrl?: string;
            category?: string;
            city?: string;
          }>(`/businesses/${providerId}`);
          if (cancelled) return;
          const name = data.businessName?.trim() || providerName || 'Proveedor';
          setSelectedConversation((current) => {
            if (!current || !isEphemeralConversation(current)) return current;
            if ((current.providerId ?? current.providerProfileId) !== providerId) return current;
            return {
              ...current,
              displayName: name,
              businessName: name,
              providerProfileName: name,
              logoUrl: data.logoUrl || current.logoUrl,
              category: data.category || current.category,
              city: data.city || current.city,
            };
          });
        } catch {
          // La cabecera usa el nombre que vino en la URL.
        }
        return;
      }

      openedContactKey.current = null;

      const conversationParam = searchParams.get('conversation');
      if (conversationParam) {
        const targetId = Number(conversationParam);
        let target = all.find((c) => c.id === targetId);
        const fromState = (location.state as { conversation?: ConversationItem } | null)
          ?.conversation;
        if (!target && fromState && fromState.id === targetId) {
          target = fromState;
          if (isSupportType(fromState.conversationType)) {
            setSupportConversations((prev) =>
              prev.some((c) => c.id === fromState.id) ? prev : sortByLastMessage([fromState, ...prev]),
            );
          } else {
            setDirectConversations((prev) =>
              prev.some((c) => c.id === fromState.id) ? prev : sortByLastMessage([fromState, ...prev]),
            );
          }
        }
        if (target) {
          const tab: InboxTab = isSupportType(target.conversationType) ? 'support' : 'direct';
          if (isStaff && tab === 'direct') {
            setInboxTab('support');
            return;
          }
          setInboxTab(tab);
          setSelectedConversation(target);
          setShowChat(true);
          return;
        }
      }
      if (isStaff) {
        setInboxTab('support');
      }
    });

    return () => {
      cancelled = true;
    };
  }, [navigate, loadConversations, searchParams, isStaff, location.state]);

  useEffect(() => {
    if (!selectedConversation || isEphemeralConversation(selectedConversation)) return;
    loadMessages(selectedConversation.id);
    const interval = setInterval(() => {
      loadMessages(selectedConversation.id);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [selectedConversation, loadMessages]);

  const handleSelectConversation = (conv: ConversationItem) => {
    setSelectedConversation(conv);
    setShowChat(true);
    setShowSupport(false);
    if (searchParams.get('providerId') || searchParams.get('conversation') !== String(conv.id)) {
      setSearchParams({ conversation: String(conv.id) }, { replace: true });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation) return;
    setSending(true);
    const content = messageText.trim();
    try {
      if (isEphemeralConversation(selectedConversation)) {
        const providerProfileId =
          selectedConversation.providerProfileId ?? selectedConversation.providerId;
        if (!providerProfileId) {
          setError('No se pudo identificar al proveedor de esta consulta.');
          return;
        }
        const { data: created } = await chatApi.startConversation({
          providerProfileId,
          initialMessage: content,
          serviceName: selectedConversation.serviceName || selectedConversation.subject || undefined,
          serviceId: selectedConversation.serviceId ?? undefined,
        });
        const persisted = withInquiryContext(
          {
            ...created,
            ephemeral: false,
            subject: created.subject || selectedConversation.serviceName || created.subject,
          },
          selectedConversation.serviceId ?? null,
          selectedConversation.serviceName || '',
        );
        setSelectedConversation(persisted);
        setMessageText('');
        setSearchParams({ conversation: String(created.id) }, { replace: true });
        const { data: history } = await chatApi.getMessages(created.id);
        setMessages(history);
        await loadConversations();
        return;
      }

      const { data } =
        isStaff && isSupportConversation
          ? selectedConversation.supportStatus === 'NEEDS_HUMAN_SUPPORT'
            ? await chatApi.replyActiveTicket(selectedConversation.id, content)
            : await chatApi.replySupportTicket(selectedConversation.id, content)
          : await chatApi.sendMessage(selectedConversation.id, content);
      setMessages((prev) => [...prev, data]);
      setMessageText('');
      await loadConversations();
    } catch (error) {
      setError(readApiError(error, 'No se pudo enviar el mensaje.'));
    } finally {
      setSending(false);
    }
  };

  const handleSendSupport = async (payload: { subject: string; initialMessage: string }) => {
    setSending(true);
    try {
      const { data } = await chatApi.createSupportTicket(payload);
      setShowSupport(false);
      await loadConversations();
      const supportConv = ticketToConversationItem(data);
      setInboxTab('support');
      setSelectedConversation({
        ...supportConv,
        displayName: 'Soporte Técnico',
      });
      setShowChat(true);
      await loadMessages(data.id);
    } catch {
      setError('No se pudo enviar la solicitud de soporte.');
    } finally {
      setSending(false);
    }
  };

  const handleAssignTicket = async () => {
    if (!selectedConversation || !isStaff) return;
    setSending(true);
    try {
      const { data } = await chatApi.assignSupportConversation(selectedConversation.id);
      const updated = ticketToConversationItem(data);
      setSelectedConversation(updated);
      setSupportConversations((prev) =>
        sortByLastMessage(prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))),
      );
      setError(null);
    } catch (error) {
      setError(readApiError(error, 'No se pudo asignar el ticket.'));
    } finally {
      setSending(false);
    }
  };

  const isSupportConversation =
    selectedConversation != null && isSupportType(selectedConversation.conversationType);

  const supportUnread = supportConversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  const listTitle = (conv: ConversationItem) => conversationTitle(conv, viewerRole);
  const listSubtitle = (conv: ConversationItem) => conversationSubtitle(conv, viewerRole);
  const listAvatar = (conv: ConversationItem) => counterpartyAvatarUrl(conv, viewerRole);

  return (
    <div
      className="flex flex-col overflow-hidden bg-gray-50"
      style={{ height: `calc(100vh - ${HEADER_HEIGHT})` }}
    >
      <div className="flex-none border-b bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Mensajes</h1>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="m-4 flex-none">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Lista lateral */}
        <div
          className={`${showChat ? 'hidden md:flex' : 'flex'} w-full min-h-0 flex-col border-r bg-white md:w-80`}
        >
          <div className="flex-none border-b p-4">
            <h2 className="text-xl font-semibold">Bandeja</h2>
            <p className="mt-1 text-xs text-gray-500">
              {inboxDescription(viewerRole, inboxTab)}
            </p>

            <div className="mt-3 flex gap-1 rounded-lg bg-gray-100 p-1">
              {!isStaff && (
                <button
                  type="button"
                  onClick={() => {
                    setInboxTab('direct');
                    if (isEphemeralConversation(selectedConversation)) {
                      discardDraft();
                      return;
                    }
                    if (selectedConversation && isSupportType(selectedConversation.conversationType)) {
                      setSelectedConversation(null);
                      setShowChat(false);
                    }
                  }}
                  className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition ${
                    inboxTab === 'direct'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {isProvider ? 'Clientes' : 'Proveedores'}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setInboxTab('support');
                  if (isEphemeralConversation(selectedConversation)) {
                    discardDraft();
                    return;
                  }
                  if (
                    selectedConversation &&
                    !isSupportType(selectedConversation.conversationType)
                  ) {
                    setSelectedConversation(null);
                    setShowChat(false);
                  }
                }}
                className={`relative flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition ${
                  inboxTab === 'support'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="inline-flex items-center justify-center gap-1">
                  <Headphones className="h-3.5 w-3.5" />
                  Soporte
                </span>
                {supportUnread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] text-white">
                    {supportUnread > 9 ? '9+' : supportUnread}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : visibleConversations.length === 0 ? (
              <div className="space-y-3 p-4 text-center text-sm text-gray-500">
                {isEphemeralConversation(selectedConversation) ? (
                  <p>
                    Borrador abierto. No aparecerá en la bandeja hasta que envíes un mensaje.
                  </p>
                ) : inboxTab === 'direct' ? (
                  <p>
                    {isProvider
                      ? 'Aún no tienes mensajes de clientes.'
                      : isStaff
                        ? 'No hay chats cliente↔negocio.'
                        : 'No tienes chats con proveedores. Contacta uno desde un servicio del catálogo.'}
                  </p>
                ) : (
                  <>
                    <p>No hay tickets de soporte en esta bandeja.</p>
                    <p className="text-xs text-gray-400">
                      El asistente virtual vive en el widget flotante; usa &quot;Soporte&quot; para
                      escalar a un agente.
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="divide-y">
                {inboxTab === 'direct' &&
                  selectedConversation &&
                  isEphemeralConversation(selectedConversation) && (
                    <div className="bg-amber-50 p-4">
                      <div className="flex gap-3">
                        <UserAvatar
                          src={listAvatar(selectedConversation)}
                          name={listTitle(selectedConversation)}
                          size="md"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <h3 className="truncate text-sm font-semibold">
                              {listTitle(selectedConversation)}
                            </h3>
                            <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                              Borrador
                            </span>
                          </div>
                          <p className="truncate text-sm text-gray-600">
                            {inquirySubtitle(selectedConversation) || 'Sin mensajes'}
                          </p>
                          <p className="mt-1 text-xs text-amber-800">
                            No se guarda hasta enviar
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                {visibleConversations.map((conv) => {
                  const title = listTitle(conv);
                  const avatar = listAvatar(conv);
                  const businessAvatar =
                    isStaff && conv.conversationType === 'CLIENT_TO_PROVIDER'
                      ? providerAvatarUrl(conv)
                      : null;
                  return (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => handleSelectConversation(conv)}
                      className={`w-full p-4 text-left hover:bg-gray-50 ${
                        selectedConversation?.id === conv.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="relative shrink-0">
                          <UserAvatar src={avatar} name={title} size="md" />
                          {businessAvatar && (
                            <UserAvatar
                              src={businessAvatar}
                              name={conv.businessName || 'Negocio'}
                              size="sm"
                              className="absolute -bottom-1 -right-1 h-5 w-5 border-2 border-white text-[8px]"
                            />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex justify-between gap-2">
                            <h3 className="truncate text-sm font-semibold">{title}</h3>
                            <span className="shrink-0 text-xs text-gray-500">
                              {formatTime(conv.lastMessageAt)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <p className="truncate text-sm text-gray-600">
                              {conv.lastMessage || 'Sin mensajes'}
                            </p>
                            {conv.unreadCount > 0 && (
                              <div className="ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
                                {conv.unreadCount}
                              </div>
                            )}
                          </div>
                          {isStaff && conv.conversationType === 'CLIENT_TO_PROVIDER' && (
                            <span className="mt-1 block truncate text-xs text-slate-500">
                              {conv.clientName || 'Cliente'} ↔{' '}
                              {conv.businessName || conv.providerProfileName || 'Negocio'}
                            </span>
                          )}
                          {isSupportType(conv.conversationType) && (
                            <span className="mt-1 inline-block text-xs text-red-500">Soporte</span>
                          )}
                          {inquirySubtitle(conv) && (
                            <span className="mt-1 block truncate text-xs text-gray-500">
                              {inquirySubtitle(conv)}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {!isStaff && (
            <div className="flex-none space-y-2 border-t bg-white p-3">
              <p className="flex items-center gap-1.5 text-xs text-gray-500">
                <Bot className="h-3.5 w-3.5" />
                Asistente virtual: usa el widget flotante
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-full border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => setShowSupport(true)}
              >
                Abrir ticket de soporte
              </Button>
            </div>
          )}
        </div>

        {/* Columna del chat */}
        <div className={`${showChat ? 'flex' : 'hidden md:flex'} min-h-0 flex-1 flex-col bg-white`}>
          {!selectedConversation ? (
            <div className="flex flex-1 items-center justify-center text-gray-500">
              Selecciona una conversación
              {!isStaff && ' o solicita soporte'}
            </div>
          ) : (
            <>
              <div className="flex flex-none items-start justify-between gap-3 border-b p-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="mb-1 flex items-center gap-2 md:hidden">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => {
                        if (isEphemeralConversation(selectedConversation)) {
                          discardDraft();
                          return;
                        }
                        setShowChat(false);
                      }}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="relative hidden shrink-0 sm:block">
                    <UserAvatar
                      src={listAvatar(selectedConversation)}
                      name={listTitle(selectedConversation)}
                      size="md"
                      className="h-11 w-11"
                    />
                    {isStaff &&
                      selectedConversation.conversationType === 'CLIENT_TO_PROVIDER' &&
                      providerAvatarUrl(selectedConversation) && (
                        <UserAvatar
                          src={providerAvatarUrl(selectedConversation)}
                          name={selectedConversation.businessName || 'Negocio'}
                          size="sm"
                          className="absolute -bottom-1 -right-1 h-6 w-6 border-2 border-white text-[9px]"
                        />
                      )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold">
                      {listTitle(selectedConversation)}
                      {isEphemeralConversation(selectedConversation) && (
                        <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                          Borrador
                        </span>
                      )}
                    </h2>
                    <p className="truncate text-sm text-gray-600">
                      {inquirySubtitle(selectedConversation) || listSubtitle(selectedConversation)}
                    </p>
                    {isStaff &&
                      selectedConversation.conversationType === 'CLIENT_TO_PROVIDER' && (
                        <p className="mt-1 truncate text-xs text-slate-500">
                          Cliente: {selectedConversation.clientName || '—'} · Negocio:{' '}
                          {selectedConversation.businessName ||
                            selectedConversation.providerProfileName ||
                            '—'}
                          {selectedConversation.providerProfileId != null &&
                            ` (#${selectedConversation.providerProfileId})`}
                        </p>
                      )}
                  </div>
                </div>

                <div className="flex shrink-0 gap-2">
                  {isStaff &&
                    isSupportConversation &&
                    selectedConversation.supportStatus === 'UNASSIGNED' && (
                      <Button
                        type="button"
                        onClick={() => void handleAssignTicket()}
                        disabled={sending}
                        className="rounded-full bg-amber-100 text-amber-800 hover:bg-amber-200"
                      >
                        <Headphones className="mr-1.5 h-4 w-4" />
                        Reclamar
                      </Button>
                    )}
                  {!isSupportConversation && !isStaff && (
                    <Button
                      onClick={() => setShowSupport(true)}
                      className="rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                    >
                      Soporte
                    </Button>
                  )}
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
                {loadingMessages && messages.length === 0 ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  </div>
                ) : messages.length === 0 && isEphemeralConversation(selectedConversation) ? (
                  <p className="px-6 pt-10 text-center text-sm text-gray-500">
                    Escribe tu consulta. Si sales sin enviar, este chat no se guardará.
                  </p>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex items-end gap-2 ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      {!message.isOwn && (
                        <UserAvatar
                          src={messageAvatarSrc(message, selectedConversation)}
                          name={message.senderName}
                          size="sm"
                        />
                      )}
                      <div
                        className={`max-w-md rounded-2xl px-4 py-2 ${
                          message.isOwn
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        {!message.isOwn && (
                          <p className="mb-1 text-xs font-medium opacity-70">
                            {message.senderName}
                          </p>
                        )}
                        <p>{message.content}</p>
                        <span className="mt-1 block text-xs opacity-70">
                          {formatTime(message.sentAt)}
                        </span>
                      </div>
                      {message.isOwn && (
                        <UserAvatar
                          src={messageAvatarSrc(
                            message,
                            selectedConversation,
                            user?.profilePictureUrl,
                          )}
                          name={user?.name || message.senderName}
                          size="sm"
                        />
                      )}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="flex-none border-t bg-white p-4">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Button type="button" variant="ghost" size="icon">
                    <Paperclip className="h-5 w-5 text-gray-600" />
                  </Button>
                  <Input
                    disabled={sending}
                    placeholder="Escribe un mensaje..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="flex-1 rounded-full"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="rounded-full bg-blue-600 hover:bg-blue-700"
                    disabled={sending || !messageText.trim()}
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>

      <SupportTicketModal
        open={showSupport}
        onOpenChange={setShowSupport}
        onSubmit={handleSendSupport}
        submitting={sending}
      />
    </div>
  );
}
