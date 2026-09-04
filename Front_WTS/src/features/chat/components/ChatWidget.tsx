import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Send, Bot, X, Headphones, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { isJwtValid } from '@/app/routes/ProtectedRoute';
import { chatApi, type SupportUrgency } from '@/features/chat/services/chatApi';
import {
  useEphemeralChatbot,
  type SuggestionChip,
} from '@/features/chat/hooks/useEphemeralChatbot';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';

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
}: {
  chips: SuggestionChip[];
  onSelect: (chip: SuggestionChip) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5 px-1 pb-1">
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          onClick={() => onSelect(chip)}
          className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
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
  const [supportMessage, setSupportMessage] = useState('');
  const [supportUrgency, setSupportUrgency] = useState<SupportUrgency>('MEDIUM');
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

  useEffect(() => {
    if (escalateOpen) {
      setSupportMessage(draftSupportMessage);
      setSupportUrgency('MEDIUM');
    }
  }, [escalateOpen, draftSupportMessage]);

  if (!visible) return null;

  const handleCreateSupportTicket = async () => {
    const message = supportMessage.trim();
    if (!message || creatingTicket) return;

    if (!canUseChatbot()) {
      toast.error('Debes iniciar sesión como turista o proveedor.');
      setVisible(false);
      return;
    }

    setCreatingTicket(true);
    try {
      const { data } = await chatApi.createSupportTicket({
        message,
        urgency: supportUrgency,
        serviceName: 'Escalado desde asistente virtual',
      });
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
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex h-[min(520px,70vh)] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between bg-slate-900 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-sky-300" />
              <div>
                <p className="text-sm font-semibold">Asistente Virtual</p>
                <p className="text-xs text-slate-300">Solo en esta sesión · sin guardar en servidor</p>
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
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-slate-100 bg-slate-50/80 px-3 pt-2">
            <SuggestionChips chips={suggestions} onSelect={selectSuggestion} />
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
              placeholder="Escribe tu consulta..."
              className="flex-1 rounded-full border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
            />
            <button
              type="submit"
              disabled={!input.trim()}
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

      <Dialog
        open={escalateOpen}
        onOpenChange={(next) => {
          setEscalateOpen(next);
          if (!next) {
            setSupportMessage('');
            setSupportUrgency('MEDIUM');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center sm:text-center">Hablar con un asesor</DialogTitle>
            <DialogDescription className="text-center sm:text-center">
              Se creará un ticket de soporte persistente para que un agente humano te atienda en
              Mensajes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
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
              onClick={() => setEscalateOpen(false)}
              disabled={creatingTicket}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="flex-1 bg-amber-600 hover:bg-amber-700"
              onClick={handleCreateSupportTicket}
              disabled={creatingTicket || !supportMessage.trim()}
            >
              {creatingTicket ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Crear ticket'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
