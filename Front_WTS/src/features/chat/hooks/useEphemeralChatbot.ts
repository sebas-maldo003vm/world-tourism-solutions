import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type FormEvent,
} from 'react';

const STORAGE_KEY = 'wts_ephemeral_chatbot';
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
  /** If true, triggers advisor escalation instead of sending a bot reply */
  escalate?: boolean;
  /** Intent key used to drive dynamic follow-up chips */
  intent?: string;
}

interface ChatState {
  messages: EphemeralMessage[];
  activeIntent: string | null;
}

type ChatAction =
  | { type: 'HYDRATE'; messages: EphemeralMessage[]; activeIntent: string | null }
  | { type: 'APPEND'; user: EphemeralMessage; bot: EphemeralMessage; intent: string | null }
  | { type: 'RESET' };

interface FaqEntry {
  intent: string;
  keywords: string[];
  chipLabel: string;
  answer: string;
  followUps: string[];
}

const FAQ: FaqEntry[] = [
  {
    intent: 'reservar',
    keywords: ['reservar', 'reserva', 'booking', 'agendar', 'cómo reservo', 'como reservo'],
    chipLabel: 'Cómo reservar',
    answer:
      'Para reservar: abre el catálogo, elige un negocio y pulsa Reservar. ' +
      'Puedes revisar tus reservas e itinerario desde el menú superior.',
    followUps: ['Ver itinerarios', 'Horarios', 'Cancelaciones'],
  },
  {
    intent: 'itinerarios',
    keywords: ['itinerario', 'itinerarios', 'viaje', 'plan', 'agenda'],
    chipLabel: 'Ver itinerarios',
    answer:
      'Tu itinerario agrupa las reservas confirmadas por ciudad. ' +
      'Accede desde el icono de calendario en la barra superior.',
    followUps: ['Cómo reservar', 'Horarios'],
  },
  {
    intent: 'horarios',
    keywords: ['horario', 'horarios', 'abre', 'apertura', 'cierre'],
    chipLabel: 'Horarios',
    answer:
      'Los horarios los publica cada proveedor en la ficha del servicio o negocio. ' +
      'Abre el catálogo, entra al perfil y revisa la información de disponibilidad.',
    followUps: ['Cómo reservar', 'Ver itinerarios'],
  },
  {
    intent: 'cancelaciones',
    keywords: ['cancelar', 'cancelación', 'cancelacion', 'anular'],
    chipLabel: 'Cancelaciones',
    answer:
      'Para gestionar o cancelar una reserva, ve a tu Perfil o Itinerario y abre el detalle. ' +
      'Si ya fue aprobada, un asesor humano puede ayudarte.',
    followUps: ['Hablar con un asesor', 'Cómo reservar'],
  },
  {
    intent: 'favoritos',
    keywords: ['favorito', 'favoritos', 'guardar'],
    chipLabel: 'Favoritos',
    answer:
      'Puedes marcar negocios como favoritos desde las tarjetas del catálogo. Los verás en tu perfil.',
    followUps: ['Cómo reservar', 'Ver itinerarios'],
  },
  {
    intent: 'pagos',
    keywords: ['pago', 'pagar', 'precio', 'costo', 'tarifa'],
    chipLabel: 'Pagos y precios',
    answer:
      'Los precios se muestran en cada servicio/negocio. El cobro y políticas específicas las define el proveedor.',
    followUps: ['Cómo reservar', 'Hablar con un asesor'],
  },
  {
    intent: 'bienvenida',
    keywords: ['hola', 'buenas', 'ayuda', 'help', 'asistente'],
    chipLabel: 'Ayuda general',
    answer:
      '¡Hola! Soy el asistente virtual de World Tourism Solutions. ' +
      'Puedo orientarte sobre reservas, itinerarios u horarios. Si necesitas más, habla con un asesor.',
    followUps: ['Cómo reservar', 'Ver itinerarios', 'Horarios'],
  },
];

const DEFAULT_CHIPS: SuggestionChip[] = [
  { id: 'reservar', label: 'Cómo reservar', intent: 'reservar' },
  { id: 'itinerarios', label: 'Ver itinerarios', intent: 'itinerarios' },
  { id: 'horarios', label: 'Horarios', intent: 'horarios' },
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

function matchFaq(text: string): FaqEntry | null {
  const normalized = text.toLowerCase().trim();
  for (const entry of FAQ) {
    if (entry.keywords.some((k) => normalized.includes(k))) {
      return entry;
    }
  }
  const byLabel = FAQ.find((e) => e.chipLabel.toLowerCase() === normalized);
  return byLabel ?? null;
}

function fallbackReply(): string {
  return (
    'No tengo una respuesta automática para eso. Prueba una sugerencia o pulsa «Hablar con un asesor» ' +
    'para abrir un ticket con un agente humano.'
  );
}

function reduceChat(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'HYDRATE':
      return { messages: action.messages, activeIntent: action.activeIntent };
    case 'APPEND':
      return {
        messages: [...state.messages, action.user, action.bot],
        activeIntent: action.intent,
      };
    case 'RESET':
      return { messages: [WELCOME], activeIntent: null };
    default:
      return state;
  }
}

function loadFromSession(): ChatState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { messages: [WELCOME], activeIntent: null };
    }
    const parsed = JSON.parse(raw) as Partial<ChatState>;
    if (!Array.isArray(parsed.messages) || parsed.messages.length === 0) {
      return { messages: [WELCOME], activeIntent: null };
    }
    return {
      messages: parsed.messages,
      activeIntent: parsed.activeIntent ?? null,
    };
  } catch {
    return { messages: [WELCOME], activeIntent: null };
  }
}

function persist(state: ChatState) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // sessionStorage puede fallar en modo privado estricto
  }
}

function chipsForIntent(intent: string | null): SuggestionChip[] {
  const entry = intent ? FAQ.find((f) => f.intent === intent) : null;
  const labels = entry?.followUps ?? DEFAULT_CHIPS.map((c) => c.label);
  const dynamic: SuggestionChip[] = labels
    .filter((label) => label !== ADVISOR_CHIP)
    .map((label) => {
      const faq = FAQ.find((f) => f.chipLabel === label);
      return {
        id: faq?.intent ?? label.toLowerCase().replace(/\s+/g, '-'),
        label,
        intent: faq?.intent,
      };
    });

  return [
    ...dynamic,
    { id: 'advisor', label: ADVISOR_CHIP, escalate: true },
  ];
}

export function useEphemeralChatbot() {
  const [state, dispatch] = useReducer(reduceChat, undefined, loadFromSession);
  const [input, setInput] = useState('');
  const [escalateOpen, setEscalateOpen] = useState(false);

  useEffect(() => {
    persist(state);
  }, [state]);

  const suggestions = useMemo(
    () => chipsForIntent(state.activeIntent),
    [state.activeIntent],
  );

  const sendText = useCallback((raw: string) => {
    const content = raw.trim();
    if (!content) return;

    if (content.toLowerCase() === ADVISOR_CHIP.toLowerCase()) {
      setEscalateOpen(true);
      return;
    }

    const matched = matchFaq(content);
    const reply = matched?.answer ?? fallbackReply();
    const intent = matched?.intent ?? null;
    const now = new Date().toISOString();

    dispatch({
      type: 'APPEND',
      user: { id: createId(), role: 'user', content, sentAt: now },
      bot: { id: createId(), role: 'bot', content: reply, sentAt: now },
      intent,
    });
  }, []);

  const sendMessage = useCallback(
    (e?: FormEvent) => {
      e?.preventDefault();
      const content = input.trim();
      if (!content) return;
      setInput('');
      sendText(content);
    },
    [input, sendText],
  );

  const selectSuggestion = useCallback(
    (chip: SuggestionChip) => {
      if (chip.escalate) {
        setEscalateOpen(true);
        return;
      }
      sendText(chip.label);
    },
    [sendText],
  );

  const requestHumanAdvisor = useCallback(() => {
    setEscalateOpen(true);
  }, []);

  const resetChat = useCallback(() => {
    dispatch({ type: 'RESET' });
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  /** Últimos mensajes del usuario para prellenar el ticket de soporte */
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
  };
}
