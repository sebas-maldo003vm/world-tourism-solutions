import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageSquare, Send, Bot, X } from 'lucide-react';
import { toast } from 'sonner';
import { isJwtValid } from '@/app/routes/ProtectedRoute';
import { chatApi, type ChatMessage, type SupportStatus } from '@/features/chat/services/chatApi';

const POLL_MS = 4000;
const SESSION_KEY = 'wts_chatbot_session_id';

type WidgetMessage = ChatMessage & { fromBot?: boolean };

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function readStoredUser(): { role?: string } | null {
  try {
    const raw = localStorage.getItem('user');
    return raw ? (JSON.parse(raw) as { role?: string }) : null;
  } catch {
    return null;
  }
}

function canUseChatbot(): boolean {
  const token = localStorage.getItem('token');
  if (!isJwtValid(token)) {
    return false;
  }
  const role = readStoredUser()?.role;
  return role === 'USER' || role === 'PROVIDER';
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    return stored ? Number(stored) : null;
  });
  const [sessionStatus, setSessionStatus] = useState<SupportStatus | null>(null);
  const [messages, setMessages] = useState<WidgetMessage[]>([]);
  const [visible, setVisible] = useState(false);
  const lastHumanMsgId = useRef<number | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const refreshVisibility = () => setVisible(canUseChatbot());
    refreshVisibility();
    window.addEventListener('storage', refreshVisibility);
    return () => window.removeEventListener('storage', refreshVisibility);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const syncHistory = useCallback(async (id: number, notifyHuman = false) => {
    if (!canUseChatbot()) {
      return;
    }

    try {
      const { data } = await chatApi.getMessages(id);
      setMessages(
        data.map((m) => ({
          ...m,
          fromBot:
            !m.isOwn &&
            (m.senderName === 'Asistente Virtual' ||
              m.senderName.toLowerCase().includes('asistente')),
        })),
      );

      if (notifyHuman) {
        const humanMsgs = data.filter(
          (m) =>
            !m.isOwn &&
            m.senderName !== 'Asistente Virtual' &&
            !m.senderName.toLowerCase().includes('asistente'),
        );
        const latest = humanMsgs[humanMsgs.length - 1];
        if (latest && latest.id !== lastHumanMsgId.current) {
          if (lastHumanMsgId.current !== null) {
            toast.info('Nuevo mensaje de soporte humano', {
              description: latest.content.slice(0, 120),
            });
          }
          lastHumanMsgId.current = latest.id;
        }
      }

      await chatApi.markRead(id);
    } catch {
      // silencioso en polling
    }
  }, []);

  useEffect(() => {
    if (!open || !conversationId) return;
    syncHistory(conversationId, true);
    const interval = setInterval(() => {
      syncHistory(conversationId, true);
    }, POLL_MS);
    return () => clearInterval(interval);
  }, [open, conversationId, syncHistory]);

  if (!visible) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = input.trim();
    if (!content || sending) return;

    if (!canUseChatbot()) {
      toast.error('Debes iniciar sesión como turista o proveedor para usar el asistente.');
      setVisible(false);
      return;
    }

    setSending(true);
    setInput('');
    try {
      const { data } = await chatApi.sendBotMessage(content, conversationId ?? undefined);
      setConversationId(data.conversationId);
      localStorage.setItem(SESSION_KEY, String(data.conversationId));
      setSessionStatus(data.sessionStatus);

      setMessages((prev) => [
        ...prev,
        { ...data.userMessage, fromBot: false },
        { ...data.botMessage, fromBot: true },
      ]);

      if (!data.automated) {
        toast.warning('Consulta escalada a soporte humano', {
          description: 'Un agente te responderá en este mismo chat.',
        });
      } else if (data.suggestions?.length) {
        toast.success('Sugerencias del asistente', {
          description: data.suggestions[0]?.title,
        });
      }
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { status?: number; data?: { message?: string } };
      };
      const status = axiosError?.response?.status;
      const message = axiosError?.response?.data?.message;

      if (status === 401 || status === 403) {
        toast.error(
          message ||
            'No autorizado para el asistente. Inicia sesión de nuevo como USER o PROVIDER.',
        );
      } else {
        toast.error(message || 'No se pudo enviar el mensaje al asistente.');
      }
      setInput(content);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex h-[min(520px,70vh)] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between bg-slate-900 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-sky-300" />
              <div>
                <p className="text-sm font-semibold">Asistente Virtual</p>
                <p className="text-xs text-slate-300">
                  {sessionStatus === 'NEEDS_HUMAN_SUPPORT' || sessionStatus === 'IN_PROGRESS'
                    ? 'Agente humano en camino / activo'
                    : 'FAQ · catálogo · soporte'}
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Cerrar chat"
              onClick={() => setOpen(false)}
              className="rounded-full p-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-3 py-4">
            {messages.length === 0 && (
              <div className="rounded-xl bg-white p-3 text-sm text-slate-600 shadow-sm">
                Hola, soy el asistente de World Tourism Solutions. Pregúntame por reservas,
                itinerario o servicios del catálogo. Si no sé la respuesta, te conecto con soporte.
              </div>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    message.isOwn
                      ? 'bg-sky-600 text-white'
                      : message.fromBot
                        ? 'border border-sky-100 bg-white text-slate-800'
                        : 'border border-amber-100 bg-amber-50 text-slate-800'
                  }`}
                >
                  {!message.isOwn && (
                    <p className="mb-1 text-[11px] font-medium opacity-70">
                      {message.fromBot ? 'Bot' : message.senderName}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <span className="mt-1 block text-[10px] opacity-60">
                    {formatTime(message.sentAt)}
                  </span>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSend} className="flex gap-2 border-t border-slate-200 bg-white p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={sending}
              placeholder="Escribe tu consulta..."
              className="flex-1 rounded-full border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-sky-600 text-white transition hover:bg-sky-700 disabled:opacity-50"
              aria-label="Enviar"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition hover:bg-slate-800"
        aria-label={open ? 'Cerrar asistente' : 'Abrir asistente virtual'}
      >
        {open ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </button>
    </div>
  );
}
