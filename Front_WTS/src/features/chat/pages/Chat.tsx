import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Send, Paperclip, MoreVertical, ArrowLeft, Loader2, AlertCircle, Bot, Headphones } from 'lucide-react';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import {
  chatApi,
  type ChatMessage,
  type ConversationItem,
  type SupportUrgency,
} from '@/features/chat/services/chatApi';
import {
  conversationSubtitle,
  conversationTitle,
  counterpartyAvatarUrl,
  initialsFromName,
  isBotConversation,
  isDirectProviderChat,
  isHumanSupportChat,
  isSupportType,
  providerAvatarUrl,
} from '@/features/chat/utils/conversationDisplay';

const POLL_INTERVAL_MS = 5000;
/** Altura del Header global (`h-16` = 4rem). */
const HEADER_HEIGHT = '4rem';

type InboxTab = 'direct' | 'support';

function formatTime(value: string) {
  return new Date(value).toLocaleString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: 'short',
  });
}

function sortByLastMessage(list: ConversationItem[]) {
  return [...list].sort(
    (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
  );
}

function AvatarBadge({
  url,
  name,
  className = 'h-10 w-10',
}: {
  url: string | null;
  name: string;
  className?: string;
}) {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className={`${className} shrink-0 rounded-full object-cover bg-gray-100`}
      />
    );
  }
  return (
    <div
      className={`${className} flex shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600`}
    >
      {initialsFromName(name)}
    </div>
  );
}

export function Chat() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [directConversations, setDirectConversations] = useState<ConversationItem[]>([]);
  const [supportConversations, setSupportConversations] = useState<ConversationItem[]>([]);
  const [inboxTab, setInboxTab] = useState<InboxTab>('direct');
  const [selectedConversation, setSelectedConversation] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [supportUrgency, setSupportUrgency] = useState<SupportUrgency>('MEDIUM');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const currentUser = (() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? (JSON.parse(stored) as { role: string }) : null;
    } catch {
      return null;
    }
  })();
  const viewerRole = currentUser?.role ?? null;
  const isAdmin = viewerRole === 'ADMIN';
  const isSupport = viewerRole === 'SUPPORT';
  const isStaff = isAdmin || isSupport;
  const isProvider = viewerRole === 'PROVIDER';

  const visibleConversations =
    inboxTab === 'direct' ? directConversations : supportConversations;

  const loadConversations = useCallback(async () => {
    try {
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
  }, []);

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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    loadConversations().then(({ providerChats, supportChats, all }) => {
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
          setInboxTab(isSupportType(target.conversationType) ? 'support' : 'direct');
          setSelectedConversation(target);
          setShowChat(true);
          return;
        }
      }
      if (isStaff && supportChats.length > 0 && providerChats.length === 0) {
        setInboxTab('support');
      }
    });
  }, [navigate, loadConversations, searchParams, isStaff, location.state]);

  useEffect(() => {
    if (!selectedConversation) return;
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
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation) return;
    setSending(true);
    try {
      const content = messageText.trim();
      const { data } =
        isStaff && isSupportConversation
          ? selectedConversation.supportStatus === 'NEEDS_HUMAN_SUPPORT'
            ? await chatApi.replyActiveTicket(selectedConversation.id, content)
            : await chatApi.replySupportTicket(selectedConversation.id, content)
          : await chatApi.sendMessage(selectedConversation.id, content);
      setMessages((prev) => [...prev, data]);
      setMessageText('');
      await loadConversations();
    } catch {
      setError('No se pudo enviar el mensaje.');
    } finally {
      setSending(false);
    }
  };

  const handleSendSupport = async () => {
    if (!supportMessage.trim()) return;
    setSending(true);
    try {
      const payload = {
        message: supportMessage.trim(),
        serviceName:
          serviceName.trim() ||
          selectedConversation?.businessName ||
          selectedConversation?.providerProfileName ||
          undefined,
        urgency: supportUrgency,
      };
      const { data } = await chatApi.createSupportTicket(payload);
      setShowSupport(false);
      setSupportMessage('');
      setServiceName('');
      setSupportUrgency('MEDIUM');
      await loadConversations();
      const supportConv: ConversationItem = {
        id: data.id,
        displayName: 'Soporte Técnico',
        lastMessage: data.message,
        lastMessageAt: data.createdAt,
        unreadCount: 0,
        conversationType: data.conversationType,
        supportStatus: data.status,
        urgency: data.urgency,
        subject: data.subject,
        providerProfileName: data.subject,
        assignedAdvisorId: data.assignedAdvisorId ?? undefined,
        assignedAdvisorName: data.assignedAdvisorName ?? undefined,
      };
      setInboxTab('support');
      setSelectedConversation(supportConv);
      setShowChat(true);
    } catch {
      setError('No se pudo enviar la solicitud de soporte.');
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
              {isProvider
                ? 'Clientes que te contactaron · soporte aparte'
                : isStaff
                  ? 'Chats cliente↔negocio y tickets humanos (sin bot)'
                  : 'Chats con proveedores · soporte en pestaña aparte'}
            </p>

            <div className="mt-3 flex gap-1 rounded-lg bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setInboxTab('direct');
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
              <button
                type="button"
                onClick={() => {
                  setInboxTab('support');
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
                {inboxTab === 'direct' ? (
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
                          <AvatarBadge url={avatar} name={title} />
                          {businessAvatar && (
                            <img
                              src={businessAvatar}
                              alt={conv.businessName || 'Negocio'}
                              className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-white object-cover bg-gray-100"
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
                      onClick={() => setShowChat(false)}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="relative hidden shrink-0 sm:block">
                    <AvatarBadge
                      url={listAvatar(selectedConversation)}
                      name={listTitle(selectedConversation)}
                      className="h-11 w-11"
                    />
                    {isStaff &&
                      selectedConversation.conversationType === 'CLIENT_TO_PROVIDER' &&
                      providerAvatarUrl(selectedConversation) && (
                        <img
                          src={providerAvatarUrl(selectedConversation)!}
                          alt={selectedConversation.businessName || 'Negocio'}
                          className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-2 border-white object-cover"
                        />
                      )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold">
                      {listTitle(selectedConversation)}
                    </h2>
                    <p className="truncate text-sm text-gray-600">
                      {listSubtitle(selectedConversation)}
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
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                    >
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

      <Dialog
        open={showSupport}
        onOpenChange={(open) => {
          setShowSupport(open);
          if (!open) {
            setSupportMessage('');
            setServiceName('');
            setSupportUrgency('MEDIUM');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center sm:text-center">Soporte</DialogTitle>
            <DialogDescription className="text-center sm:text-center">
              Describe tu solicitud y el equipo de soporte te responderá lo antes posible. Para
              dudas rápidas usa el asistente virtual (widget).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <Input
              placeholder="Servicio relacionado (opcional)"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
            />
            <Input
              placeholder="Describe tu solicitud..."
              value={supportMessage}
              onChange={(e) => setSupportMessage(e.target.value)}
            />
            <Select
              value={supportUrgency}
              onValueChange={(value) => setSupportUrgency(value as SupportUrgency)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Urgencia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Baja</SelectItem>
                <SelectItem value="MEDIUM">Media</SelectItem>
                <SelectItem value="HIGH">Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="flex-row gap-2 sm:justify-stretch">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setShowSupport(false)}
              disabled={sending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="flex-1 bg-red-500 hover:bg-red-600"
              onClick={handleSendSupport}
              disabled={sending || !supportMessage.trim()}
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
