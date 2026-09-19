import type { ReactNode } from 'react';
import { cn } from '@/shared/components/ui/utils';

export interface LookerEmbedContainerProps {
  title: string;
  description?: string;
  /** URL del reporte o visualización de Looker Studio. Sin URL se muestra la vista previa. */
  embedUrl?: string;
  isLoading?: boolean;
  className?: string;
  children: ReactNode;
}

export function LookerEmbedContainer({
  title,
  description,
  embedUrl,
  isLoading = false,
  className,
  children,
}: LookerEmbedContainerProps) {
  const isEmbedded = Boolean(embedUrl);

  return (
    <section
      className={cn(
        'flex h-full flex-col bg-white rounded-xl border border-slate-200 p-6 shadow-sm',
        className,
      )}
    >
      <header className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {description && (
            <p className="mt-1 text-sm leading-relaxed text-slate-500">{description}</p>
          )}
        </div>
        <StatusBadge embedded={isEmbedded} />
      </header>

      <div className={cn('relative min-h-[400px] flex-1', isEmbedded && 'h-[560px]')}>
        {isLoading ? (
          <ChartSkeleton />
        ) : isEmbedded ? (
          <iframe
            src={embedUrl}
            title={title}
            className="h-full min-h-[400px] w-full border-0"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          children
        )}
      </div>
    </section>
  );
}

function StatusBadge({ embedded }: { embedded: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        embedded
          ? 'bg-emerald-50 text-emerald-700'
          : 'bg-slate-100 text-slate-600',
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          embedded ? 'bg-emerald-500' : 'bg-amber-400',
        )}
        aria-hidden="true"
      />
      {embedded ? 'Looker Studio' : 'Vista previa'}
    </span>
  );
}

function ChartSkeleton() {
  const bars = ['42%', '58%', '49%', '72%', '63%', '81%', '68%', '90%', '76%', '54%'];

  return (
    <div
      className="flex h-[400px] flex-col justify-end gap-4"
      role="status"
      aria-label="Cargando visualización"
    >
      <div className="h-4 w-32 animate-pulse rounded-full bg-slate-100" />
      <div className="flex h-full items-end gap-2">
        {bars.map((height, index) => (
          <div
            key={`${height}-${index}`}
            className="flex-1 animate-pulse rounded-t-md bg-slate-100"
            style={{ height }}
          />
        ))}
      </div>
    </div>
  );
}
