import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Bot, X, Headphones, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { isJwtValid } from '@/app/routes/ProtectedRoute';
import { chatApi } from '@/features/chat/services/chatApi';
import { SupportTicketModal } from '@/features/chat/components/SupportTicketModal';
import {
  useEphemeralChatbot,
  type SuggestionChip,
} from '@/features/chat/hooks/useEphemeralChatbot';

function formatTime(value: string) {
  if (value === new Date(0).toISOString()) return '';
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
  if (!isJwtValid(token)) return false;
  const role = readStoredUser()?.role;
  return role === 'USER' || role === 'PROVIDER';
}

function SuggestionChips({
  chips,
  onSelect,
  disabled,
}: {
  chips: SuggestionChip[];
  onSelect: (chip: SuggestionChip) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1.5 px-1 pb-1">
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(chip)}
          className={`rounded-full border px-2.5 py-1 text-xs font-medium transition disabled:opacity-50 ${
            chip.escalate
              ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
              : 'border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50'
          }`}
        >
          {chip.escalate ? (
            <span className="inline-flex items-center gap-1">
              <Headphones className="h-3 w-3" />
              {chip.label}
            </span>
          ) : (
            chip.label
          )}
        </button>
      ))}
    </div>
  );
}

export function ChatWidget() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [creatingTicket, setCreatingTicket] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const {
    messages,
    input,
    setInput,
    suggestions,
    sendMessage,
    selectSuggestion,
    escalateOpen,
    setEscalateOpen,
    draftSupportMessage,
    loading,
  } = useEphemeralChatbot();

  useEffect(() => {
    const refreshVisibility = () => setVisible(canUseChatbot());
    refreshVisibility();
    window.addEventListener('storage', refreshVisibility);
    return () => window.removeEventListener('storage', refreshVisibility);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  if (!visible) return null;

  const handleCreateSupportTicket = async (payload: {
    subject: string;
    initialMessage: string;
  }) => {
    if (creatingTicket) return;

    if (!canUseChatbot()) {
      toast.error('Debes iniciar sesión como turista o proveedor.');
      setVisible(false);
      return;
    }

    setCreatingTicket(true);
    try {
      const { data } = await chatApi.createSupportTicket(payload);
      setEscalateOpen(false);
      setOpen(false);
      toast.success('Ticket de soporte creado', {
        description: 'Un asesor humano te responderá en Mensajes → Soporte.',
      });
      navigate(`/chat?conversation=${data.id}`);
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { status?: number; data?: { message?: string } };
      };
      const status = axiosError?.response?.status;
      const apiMessage = axiosError?.response?.data?.message;
      if (status === 401 || status === 403) {
        toast.error(apiMessage || 'No autorizado. Inicia sesión de nuevo.');
      } else {
        toast.error(apiMessage || 'No se pudo crear el ticket de soporte.');
      }
    } finally {
      setCreatingTicket(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      {open && (
        <div className="flex h-[min(520px,70vh)] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between bg-slate-900 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-sky-300" />
              <div>
                <p className="text-sm font-semibold">Asistente Virtual (Gemini)</p>
                <p className="text-xs text-slate-300">Inteligencia Artificial Activa</p>
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
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    message.role === 'user'
                      ? 'bg-sky-600 text-white'
                      : 'border border-sky-100 bg-white text-slate-800'
                  }`}
                >
                  {message.role === 'bot' && (
                    <p className="mb-1 text-[11px] font-medium opacity-70">Bot</p>
                  )}
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {formatTime(message.sentAt) && (
                    <span className="mt-1 block text-[10px] opacity-60">
                      {formatTime(message.sentAt)}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl border border-sky-100 bg-white px-3 py-2 text-sm text-slate-500 shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-sky-600" />
                  <span>Pensando respuesta...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-slate-100 bg-slate-50/80 px-3 pt-2">
            <SuggestionChips chips={suggestions} onSelect={selectSuggestion} disabled={loading} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!canUseChatbot()) {
                toast.error('Debes iniciar sesión como turista o proveedor.');
                setVisible(false);
                return;
              }
              sendMessage(e);
            }}
            className="flex gap-2 border-t border-slate-200 bg-white p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              placeholder="Escribe tu consulta..."
              className="flex-1 rounded-full border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-sky-600 text-white transition hover:bg-sky-700 disabled:opacity-50"
              aria-label="Enviar"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>
        </div>
      )}

      <div className="group relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition hover:bg-slate-800"
          aria-label={open ? 'Cerrar asistente' : 'Abrir asistente virtual'}
        >
          {open ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
        </button>
        {!open && (
          <span
            role="tooltip"
            className="pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 whitespace-nowrap rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100"
          >
            Asistente virtual
          </span>
        )}
      </div>

      <SupportTicketModal
        open={escalateOpen}
        onOpenChange={setEscalateOpen}
        onSubmit={handleCreateSupportTicket}
        submitting={creatingTicket}
        title="Hablar con un asesor"
        description="Se creará un ticket de soporte persistente para que un agente humano te atienda en Mensajes."
        submitLabel="Enviar"
        defaultMessage={draftSupportMessage}
      />
    </div>
  );
}