import type { ReactNode } from 'react';
import { BarChart3, Loader2 } from 'lucide-react';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { cn } from '@/shared/components/ui/utils';

export interface LookerEmbedContainerProps {
  title: string;
  /** URL del reporte de Looker Studio (ya filtrada por proveedor). */
  embedUrl?: string;
  isLoading?: boolean;
  /** Sesión de proveedor ausente: no se renderiza el iframe. */
  requiresSession?: boolean;
  className?: string;
}

export function LookerEmbedContainer({
  title,
  embedUrl,
  isLoading = false,
  requiresSession = false,
  className,
}: LookerEmbedContainerProps) {
  const isReady = Boolean(embedUrl) && !isLoading && !requiresSession;

  return (
    <section
      className={cn(
        'overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-md',
        className,
      )}
    >
      <div className="relative w-full overflow-hidden bg-white">
        {isLoading ? (
          <EmbedSkeleton />
        ) : requiresSession ? (
          <EmbedStatus
            icon={<BarChart3 className="h-6 w-6 text-slate-400" />}
            title="Sesión de proveedor requerida"
            description="Inicia sesión como proveedor para ver el panel de analítica filtrado con tus datos."
          />
        ) : isReady && embedUrl ? (
          <iframe
            src={embedUrl}
            title={title}
            width="100%"
            height="800"
            frameBorder="0"
            className="block h-[800px] w-full rounded-xl border-0 bg-white shadow-md"
            allow="fullscreen"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <EmbedStatus
            icon={<BarChart3 className="h-6 w-6 text-slate-400" />}
            title="Reporte no disponible"
            description="No se pudo resolver la URL de Looker Studio. Revisa la configuración del entorno."
          />
        )}
      </div>
    </section>
  );
}

function EmbedSkeleton() {
  return (
    <div
      className="flex h-[800px] w-full flex-col gap-4 p-6"
      role="status"
      aria-busy="true"
      aria-label="Cargando reporte de analítica"
    >
      <div className="flex items-center gap-3">
        <Loader2 className="h-5 w-5 shrink-0 animate-spin text-slate-400" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-48 rounded-md bg-slate-200" />
          <Skeleton className="h-3 w-72 rounded-md bg-slate-100" />
        </div>
      </div>
      <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-3">
        <Skeleton className="h-28 rounded-xl bg-slate-100" />
        <Skeleton className="h-28 rounded-xl bg-slate-100" />
        <Skeleton className="h-28 rounded-xl bg-slate-100" />
      </div>
      <Skeleton className="min-h-0 flex-1 rounded-xl bg-slate-100" />
    </div>
  );
}

function EmbedStatus({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div
      className="flex h-[800px] flex-col items-center justify-center gap-3 px-6 py-16 text-center"
      role="status"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 shadow-sm">
        {icon}
      </span>
      <div className="max-w-sm space-y-1.5">
        <p className="text-sm font-medium text-slate-800">{title}</p>
        <p className="text-sm leading-relaxed text-slate-500">{description}</p>
      </div>
    </div>
  );
}
