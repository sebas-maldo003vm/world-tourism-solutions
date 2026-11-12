import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type FormEvent,
} from 'react';
import { chatApi } from '@/features/chat/services/chatApi';
import { toast } from 'sonner';

const STORAGE_KEY = 'wts_ephemeral_chatbot_msgs';
const TIMESTAMP_KEY = 'wts_ephemeral_chatbot_time';
const SESSION_EXPIRATION_MS = 15 * 60 * 1000; // 15 minutos

export const ADVISOR_CHIP = 'Hablar con un asesor';

export type EphemeralRole = 'user' | 'bot';

export interface EphemeralMessage {
  id: string;
  role: EphemeralRole;
  content: string;
  sentAt: string;
}

export interface SuggestionChip {
  id: string;
  label: string;
  escalate?: boolean;
  intent?: string;
}

interface ChatState {
  messages: EphemeralMessage[];
}

type ChatAction =
  | { type: 'HYDRATE'; messages: EphemeralMessage[] }
  | { type: 'APPEND_USER'; message: EphemeralMessage }
  | { type: 'APPEND_BOT'; message: EphemeralMessage }
  | { type: 'RESET' };

const DEFAULT_CHIPS: SuggestionChip[] = [
  { id: 'reservar', label: 'Cómo reservar' },
  { id: 'itinerarios', label: 'Ver itinerarios' },
  { id: 'horarios', label: 'Horarios' },
];

const WELCOME: EphemeralMessage = {
  id: 'welcome',
  role: 'bot',
  content:
    'Hola, soy el asistente de World Tourism Solutions. Pregúntame por reservas, itinerarios u horarios. ' +
    'Si prefieres atención personalizada, usa «Hablar con un asesor».',
  sentAt: new Date(0).toISOString(),
};

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function reduceChat(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'HYDRATE':
      return { messages: action.messages };
    case 'APPEND_USER':
      return {
        ...state,
        messages: [...state.messages, action.message],
      };
    case 'APPEND_BOT':
      return {
        messages: [...state.messages, action.message],
      };
    case 'RESET':
      return { messages: [WELCOME] };
    default:
      return state;
  }
}

function loadFromSession(): ChatState {
  try {
    const rawTime = sessionStorage.getItem(TIMESTAMP_KEY);
    if (rawTime) {
      const lastActivity = parseInt(rawTime, 10);
      const now = Date.now();
      if (now - lastActivity > SESSION_EXPIRATION_MS) {
        sessionStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(TIMESTAMP_KEY);
        return { messages: [WELCOME] };
      }
    }

    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { messages: [WELCOME] };
    }
    const parsed = JSON.parse(raw) as Partial<ChatState>;
    if (!Array.isArray(parsed.messages) || parsed.messages.length === 0) {
      return { messages: [WELCOME] };
    }
    return { messages: parsed.messages };
  } catch {
    return { messages: [WELCOME] };
  }
}

function persist(state: ChatState) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    sessionStorage.setItem(TIMESTAMP_KEY, Date.now().toString());
  } catch {
    // sessionStorage puede fallar en modo privado estricto
  }
}

export function useEphemeralChatbot() {
  const [state, dispatch] = useReducer(reduceChat, undefined, loadFromSession);
  const [input, setInput] = useState('');
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);

  // NUEVO: Limpiar y reiniciar el chat automáticamente al detectar login o cambio de token en localStorage
  useEffect(() => {
    const handleLoginOrStorageChange = () => {
      const token = localStorage.getItem('token');
      if (token) {
        // Si hay token activo (inicio de sesión), forzamos el reseteo del chat e hilo
        dispatch({ type: 'RESET' });
        setConversationId(null);
        sessionStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(TIMESTAMP_KEY);
      }
    };

    // Ejecutar al montar por si acaba de iniciar sesión
    handleLoginOrStorageChange();

    // Escuchar cambios de almacenamiento por si inicia sesión en otra pestaña o se actualiza el token
    window.addEventListener('storage', handleLoginOrStorageChange);
    return () => window.removeEventListener('storage', handleLoginOrStorageChange);
  }, []);

  useEffect(() => {
    persist(state);
  }, [state]);

  const suggestions = useMemo(() => {
    return [
      ...DEFAULT_CHIPS,
      { id: 'advisor', label: ADVISOR_CHIP, escalate: true },
    ];
  }, []);

  const sendText = useCallback(
    async (raw: string) => {
      const content = raw.trim();
      if (!content || loading) return;

      if (content.toLowerCase() === ADVISOR_CHIP.toLowerCase()) {
        setEscalateOpen(true);
        return;
      }

      const now = new Date().toISOString();
      const userMessage: EphemeralMessage = {
        id: createId(),
        role: 'user',
        content,
        sentAt: now,
      };

      dispatch({ type: 'APPEND_USER', message: userMessage });
      setLoading(true);

      try {
        const response = await chatApi.sendBotMessage(
          content,
          conversationId ?? undefined
        );

        const data = response.data;
        
        if (data.conversationId) {
          setConversationId(data.conversationId);
        }

        const botContent = data.reply || 'Respuesta generada por el asistente.';
        const botMessage: EphemeralMessage = {
          id: createId(),
          role: 'bot',
          content: botContent,
          sentAt: new Date().toISOString(),
        };

        dispatch({ type: 'APPEND_BOT', message: botMessage });
      } catch (error) {
        console.error('Error al conectar con el backend de Gemini:', error);
        toast.error('No se pudo obtener respuesta del asistente virtual.');
        
        const errorMessage: EphemeralMessage = {
          id: createId(),
          role: 'bot',
          content: 'Disculpa, tuve un problema al procesar tu solicitud con el servicio cognitivo.',
          sentAt: new Date().toISOString(),
        };
        dispatch({ type: 'APPEND_BOT', message: errorMessage });
      } finally {
        setLoading(false);
      }
    },
    [loading, conversationId]
  );

  const sendMessage = useCallback(
    (e?: FormEvent) => {
      e?.preventDefault();
      const content = input.trim();
      if (!content) return;
      setInput('');
      sendText(content);
    },
    [input, sendText]
  );

  const selectSuggestion = useCallback(
    (chip: SuggestionChip) => {
      if (chip.escalate) {
        setEscalateOpen(true);
        return;
      }
      sendText(chip.label);
    },
    [sendText]
  );

  const requestHumanAdvisor = useCallback(() => {
    setEscalateOpen(true);
  }, []);

  const resetChat = useCallback(() => {
    dispatch({ type: 'RESET' });
    setConversationId(null);
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(TIMESTAMP_KEY);
  }, []);

  const draftSupportMessage = useMemo(() => {
    const userMsgs = state.messages.filter((m) => m.role === 'user').map((m) => m.content);
    if (userMsgs.length === 0) {
      return 'Necesito hablar con un asesor humano.';
    }
    const last = userMsgs.slice(-3).join(' · ');
    return `Solicito atención de un asesor. Contexto del chat: ${last}`;
  }, [state.messages]);

  return {
    messages: state.messages,
    input,
    setInput,
    suggestions,
    sendMessage,
    selectSuggestion,
    requestHumanAdvisor,
    resetChat,
    escalateOpen,
    setEscalateOpen,
    draftSupportMessage,
    loading,
  };
}