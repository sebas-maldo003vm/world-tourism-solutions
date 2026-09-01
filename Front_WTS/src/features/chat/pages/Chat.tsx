import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Card, CardContent } from '@/shared/components/ui/card';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Send, Paperclip, MoreVertical, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import {
  chatApi,
  type ChatMessage,
  type ConversationItem,
  type SupportUrgency,
} from '@/features/chat/services/chatApi';

const POLL_INTERVAL_MS = 5000;

function formatTime(value: string) {
  return new Date(value).toLocaleString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: 'short',
  });
}

export function Chat() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
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

  const currentUser = (() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? (JSON.parse(stored) as { role: string }) : null;
    } catch {
      return null;
    }
  })();
  const isAdmin = currentUser?.role === 'ADMIN';

  const loadConversations = useCallback(async () => {
    try {
      const { data } = await chatApi.listConversations();
      const providerChats = data.filter((c) => c.conversationType === 'CLIENT_TO_PROVIDER');
      const supportChats = data.filter(
        (c) => c.conversationType === 'CLIENT_TO_SUPPORT' || c.conversationType === 'PROVIDER_TO_SUPPORT',
      );
      const sorted = [...providerChats, ...supportChats].sort(
        (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
      );
      setConversations(sorted);
      setError(null);
      return sorted;
    } catch {
      setError('No se pudieron cargar las conversaciones.');
      return [];
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
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)),
      );
    } catch {
      setError('No se pudieron cargar los mensajes.');
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    loadConversations().then((loaded) => {
      const conversationParam = searchParams.get('conversation');
      if (conversationParam && loaded) {
        const target = loaded.find((c) => c.id === Number(conversationParam));
        if (target) {
          setSelectedConversation(target);
          setShowChat(true);
        }
      }
    });
  }, [navigate, loadConversations, searchParams]);

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
        isAdmin && isSupportConversation
          ? await chatApi.replySupportTicket(selectedConversation.id, content)
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
        serviceName: serviceName.trim() || selectedConversation?.serviceName || undefined,
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
        displayName: 'Atención al Cliente',
        lastMessage: data.message,
        lastMessageAt: data.createdAt,
        unreadCount: 0,
        conversationType: data.conversationType,
        supportStatus: data.status,
        urgency: data.urgency,
        serviceName: data.serviceName,
      };
      setSelectedConversation(supportConv);
      setShowChat(true);
    } catch {
      setError('No se pudo enviar la solicitud de soporte.');
    } finally {
      setSending(false);
    }
  };

  const isSupportConversation =
    selectedConversation?.conversationType === 'CLIENT_TO_SUPPORT' ||
    selectedConversation?.conversationType === 'PROVIDER_TO_SUPPORT';

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b px-4 py-3">
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
        <Alert variant="destructive" className="m-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex-1 flex overflow-hidden">
        <div
          className={`${showChat ? 'hidden md:block' : 'block'} w-full md:w-80 border-r bg-white flex flex-col`}
        >
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">Mensajes</h2>
            <p className="text-xs text-gray-500 mt-1">Proveedores y soporte</p>
          </div>

          <ScrollArea className="flex-1">
            {loading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : conversations.length === 0 ? (
              <p className="p-4 text-sm text-gray-500 text-center">
                No tienes conversaciones activas. Contacta a un proveedor desde un servicio o abre un ticket de soporte.
              </p>
            ) : (
              <div className="divide-y">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`w-full p-4 text-left hover:bg-gray-50 ${
                      selectedConversation?.id === conv.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex justify-between mb-1">
                      <h3 className="font-semibold text-sm">{conv.displayName}</h3>
                      <span className="text-xs text-gray-500">{formatTime(conv.lastMessageAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-sm text-gray-600 truncate">{conv.lastMessage || 'Sin mensajes'}</p>
                      {conv.unreadCount > 0 && (
                        <div className="ml-2 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                          {conv.unreadCount}
                        </div>
                      )}
                    </div>
                    {conv.conversationType !== 'CLIENT_TO_PROVIDER' && (
                      <span className="text-xs text-red-500 mt-1 inline-block">Soporte</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="flex-1 flex flex-col bg-white">
          {!selectedConversation ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Selecciona una conversación o solicita soporte
            </div>
          ) : (
            <>
              <div className="p-4 border-b flex justify-between">
                <div>
                  <h2 className="font-semibold">{selectedConversation.displayName}</h2>
                  <p className="text-sm text-gray-600">
                    {isSupportConversation ? 'Canal de soporte' : 'Contacto directo con proveedor'}
                  </p>
                </div>

                <div className="flex gap-2">
                  {!isSupportConversation && (
                    <Button
                      onClick={() => setShowSupport(true)}
                      className="rounded-full bg-red-100 hover:bg-red-200 text-red-600"
                    >
                      Soporte
                    </Button>
                  )}
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <ScrollArea className="flex-1 p-4">
                {showSupport ? (
                  <div className="max-w-md mx-auto">
                    <Card>
                      <CardContent className="p-6 space-y-4">
                        <h2 className="text-xl font-semibold text-center">Soporte</h2>
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
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => setShowSupport(false)}
                          >
                            Cancelar
                          </Button>
                          <Button
                            className="w-full bg-red-500 hover:bg-red-600"
                            onClick={handleSendSupport}
                            disabled={sending || !supportMessage.trim()}
                          >
                            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : loadingMessages && messages.length === 0 ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
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
                            <p className="text-xs font-medium mb-1 opacity-70">{message.senderName}</p>
                          )}
                          <p>{message.content}</p>
                          <span className="text-xs block mt-1 opacity-70">
                            {formatTime(message.sentAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              <div className="p-4 border-t">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Button type="button" variant="ghost" size="icon" disabled={showSupport}>
                    <Paperclip className="h-5 w-5 text-gray-600" />
                  </Button>
                  <Input
                    disabled={showSupport || sending}
                    placeholder="Escribe un mensaje..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="flex-1 rounded-full"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="rounded-full bg-blue-600 hover:bg-blue-700"
                    disabled={showSupport || sending || !messageText.trim()}
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
    </div>
  );
}
