import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';

export const FEEDBACK_STORAGE_KEYS = {
  itinerary: 'has_voted_itinerary',
  booking: 'has_voted_booking',
} as const;

export type FeedbackStorageKey =
  (typeof FEEDBACK_STORAGE_KEYS)[keyof typeof FEEDBACK_STORAGE_KEYS];

const DEFAULT_QUESTION =
  '¿Qué te pareció esta experiencia? Ayúdanos a mejorar evaluando tu proceso.';

export function getFeedbackFormUrl(): string {
  return import.meta.env.VITE_FEEDBACK_FORM_URL?.trim() ?? '';
}

type FeedbackPromptProps = {
  open: boolean;
  storageKey: FeedbackStorageKey;
  surveyUrl?: string;
  title?: string;
};

function shouldShowFeedback(key: string): boolean {
  try {
    const lastShown = sessionStorage.getItem(key);

    // Primera aparición: siempre mostrar.
    if (!lastShown) {
      return true;
    }

    // Próximas apariciones: probabilidad del 30 %.
    return Math.random() < 0.3;
  } catch {
    return true;
  }
}

function writeSessionFlag(key: string) {
  try {
    sessionStorage.setItem(key, 'true');
  } catch {
    // Storage can be blocked.
  }
}

export function FeedbackPrompt({
  open,
  storageKey,
  surveyUrl = getFeedbackFormUrl(),
  title = DEFAULT_QUESTION,
}: FeedbackPromptProps) {
  const titleId = useId();
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);

// COMPROBAR URL DE ENCUESTA
console.log('URL DE ENCUESTA:', surveyUrl);

  useEffect(() => {
    if (!open || !shouldShowFeedback(storageKey)) {
      setVisible(false);
      return;
    }
 // TEMPORAL: permitir mostrar la notificación en cada prueba
  sessionStorage.removeItem(storageKey);
    const timer = window.setTimeout(() => setVisible(true), reduceMotion ? 0 : 450);
    return () => window.clearTimeout(timer);
  }, [open, reduceMotion, storageKey]);

  const dismiss = () => {
    writeSessionFlag(storageKey);
    setVisible(false);
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.aside
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          initial={reduceMotion ? false : { opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
          transition={{
            duration: reduceMotion ? 0.01 : 0.35,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="fixed bottom-24 left-4 right-4 z-50 w-auto max-w-sm sm:bottom-6 sm:left-6 sm:right-auto"
        >
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-900/10">
            <div className="flex items-start gap-3">
              <p
                id={titleId}
                className="min-w-0 flex-1 text-sm font-medium leading-snug text-slate-800"
              >
                {title}
              </p>

              <button
                type="button"
                onClick={dismiss}
                aria-label="Cerrar"
                className="shrink-0 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={dismiss}
                className="rounded-full px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                Cerrar
              </button>

              <a
                href={surveyUrl || undefined}
                target="_blank"
                rel="noopener noreferrer"
                aria-disabled={!surveyUrl}
                onClick={(event) => {
                  if (!surveyUrl) {
                    event.preventDefault();
                    return;
                  }

                  dismiss();
                }}
                className={`inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 ${
                  surveyUrl ? '' : 'pointer-events-none opacity-50'
                }`}
              >
                Ir a la encuesta
              </a>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>,
    document.body
  );
}