import { useState } from 'react';
import { CircleHelp } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { LookerEmbedContainer } from '@/features/provider/components/LookerEmbedContainer';
import { resolveProviderLookerUrl } from '@/features/provider/analytics/lookerConfig';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';

export interface ProviderAnalyticsProps {
  /**
   * URL del reporte maestro de Looker Studio.
   * Por defecto: `VITE_LOOKER_REPORT_URL` / constante del reporte corporativo.
   */
  embedUrl?: string;
  /**
   * IDs de datasource Looker a filtrar (por defecto ds1, ds2, ds3).
   * También acepta CSV: `"ds1,ds2,ds3"`.
   */
  datasourceIds?: readonly string[] | string;
  isLoading?: boolean;
}

export function ProviderAnalytics({
  embedUrl,
  datasourceIds,
  isLoading = false,
}: ProviderAnalyticsProps) {
  const { user } = useAuth();
  const [helpOpen, setHelpOpen] = useState(false);

  const providerId = user?.id != null ? Number(user.id) : null;
  const hasValidProviderId =
    providerId != null && Number.isFinite(providerId);

  const lookerUrl = hasValidProviderId
    ? resolveProviderLookerUrl({
        reportUrl: embedUrl,
        datasourceIds,
        userId: providerId,
      })
    : '';

  const requiresSession = !isLoading && !hasValidProviderId;

  return (
    <div className="min-h-screen bg-slate-50 py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Analítica y Rendimiento del Negocio
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-500 sm:text-base">
              Panel en vivo de Looker Studio con tus métricas de rendimiento,
              reservas y embudo de conversión.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setHelpOpen(true)}
            className="shrink-0 gap-2 rounded-lg border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900"
            aria-haspopup="dialog"
          >
            <CircleHelp className="h-4 w-4" aria-hidden="true" />
            Cómo leer el panel
          </Button>
        </header>

        {requiresSession && (
          <div className="mb-4 rounded-xl border border-amber-100 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
            Se requiere la sesión del proveedor para filtrar el reporte en todas
            las fuentes de datos (ds1, ds2 y ds3).
          </div>
        )}

        <LookerEmbedContainer
          title="Reporte de analítica del proveedor"
          embedUrl={lookerUrl}
          isLoading={isLoading}
          requiresSession={requiresSession}
        />
      </div>

      <AnalyticsHelpModal open={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  );
}

function AnalyticsHelpModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cómo leer tu panel de analítica</DialogTitle>
          <DialogDescription>
            El reporte embebido resume el rendimiento de tu negocio. Usa las
            pestañas del propio Looker Studio para cambiar de página.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-1 text-sm text-slate-600">
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-900">
              Página 1 — Rendimiento y Reservas
            </h3>
            <ul className="list-disc space-y-1.5 pl-5 leading-relaxed">
              <li>
                <span className="font-medium text-slate-800">Visualizaciones</span>
                {' '}
                y consultas: cuántas veces ven o buscan tus experiencias.
              </li>
              <li>
                <span className="font-medium text-slate-800">Reservas confirmadas</span>
                {' '}
                e ingresos estimados: el resultado comercial del periodo.
              </li>
              <li>
                <span className="font-medium text-slate-800">Tendencias</span>
                {' '}
                diarias o semanales: detecta picos, caídas y estacionalidad.
              </li>
              <li>
                Servicios más consultados: prioriza inventario y promoción.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-900">
              Página 2 — Embudo de conversión e interacciones
            </h3>
            <ul className="list-disc space-y-1.5 pl-5 leading-relaxed">
              <li>
                Recorre el camino completo: búsqueda → visualización → clic →
                reserva.
              </li>
              <li>
                Identifica en qué paso pierdes viajeros y dónde conviene
                mejorar la ficha o el precio.
              </li>
              <li>
                Compara tasas de conversión entre experiencias para decidir
                qué impulsar o ajustar.
              </li>
            </ul>
          </section>

          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-500">
            El panel ya está filtrado por tu usuario (
            <code className="rounded bg-white px-1 py-0.5 text-[11px] text-slate-700">
              id_proveedor
            </code>
            ) en las fuentes ds1, ds2 y ds3. Usa los controles de fecha del
            propio reporte de Looker Studio para cambiar el periodo.
          </p>
        </div>

        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Entendido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
