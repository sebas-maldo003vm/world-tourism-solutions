import { useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarCheck,
  Eye,
  FileDown,
  Info,
  Minus,
  Percent,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { BehaviorChart, PerformanceChart, TopServicesChart } from '@/features/provider/components/AnalyticsCharts';
import { LookerEmbedContainer } from '@/features/provider/components/LookerEmbedContainer';
import {
  buildSnapshot,
  formatCompactCurrency,
  formatCurrency,
  formatInputDate,
  formatNumber,
  formatPercent,
  RANGE_OPTIONS,
  type AnalyticsSnapshot,
  type DateRangeKey,
  type KpiMetric,
} from '@/features/provider/analytics/analyticsPreview';
import { cn } from '@/shared/components/ui/utils';

export interface AnalyticsSectionEmbeds {
  performance?: string;
  topServices?: string;
  behavior?: string;
}

export interface ProviderAnalyticsProps {
  /**
   * URL del reporte de Looker Studio. Si se informa y no hay URLs por sección,
   * el área de visualizaciones se reemplaza por un iframe a pantalla completa.
   */
  embedUrl?: string;
  /** URLs independientes para embeber cada tarjeta cuando Looker esté listo. */
  sectionEmbeds?: AnalyticsSectionEmbeds;
  isLoading?: boolean;
}

const kpiConfig = [
  {
    id: 'views',
    label: 'Visualizaciones Totales',
    hint: 'Veces que vieron tus servicios',
    icon: Eye,
    iconClass: 'bg-sky-50 text-sky-700',
    stroke: '#0284c7',
    format: (value: number) => formatNumber(value),
  },
  {
    id: 'bookings',
    label: 'Reservas Confirmadas',
    hint: 'Reservas concretadas en el periodo',
    icon: CalendarCheck,
    iconClass: 'bg-blue-50 text-blue-700',
    stroke: '#1d4ed8',
    format: (value: number) => formatNumber(value),
  },
  {
    id: 'conversion',
    label: 'Tasa de Conversión',
    hint: 'Clics que terminaron en reserva',
    icon: Percent,
    iconClass: 'bg-violet-50 text-violet-700',
    stroke: '#7c3aed',
    format: (value: number) => formatPercent(value),
  },
  {
    id: 'revenue',
    label: 'Ingresos Estimados',
    hint: 'Monto generado en el periodo',
    icon: Wallet,
    iconClass: 'bg-emerald-50 text-emerald-700',
    stroke: '#059669',
    format: (value: number) => formatCompactCurrency(value),
    title: (value: number) => formatCurrency(value),
  },
] as const;

export function ProviderAnalytics({
  embedUrl = cleanUrl(import.meta.env.VITE_LOOKER_EMBED_URL),
  sectionEmbeds,
  isLoading = false,
}: ProviderAnalyticsProps) {
  const [range, setRange] = useState<DateRangeKey>('last30');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const today = formatInputDate(new Date());
  const resolvedEmbeds = {
    performance: cleanUrl(sectionEmbeds?.performance) ?? cleanUrl(import.meta.env.VITE_LOOKER_PERFORMANCE_URL),
    topServices: cleanUrl(sectionEmbeds?.topServices) ?? cleanUrl(import.meta.env.VITE_LOOKER_TOP_SERVICES_URL),
    behavior: cleanUrl(sectionEmbeds?.behavior) ?? cleanUrl(import.meta.env.VITE_LOOKER_BEHAVIOR_URL),
  };
  const hasSectionEmbeds = Boolean(
    resolvedEmbeds.performance || resolvedEmbeds.topServices || resolvedEmbeds.behavior,
  );
  const fullEmbedUrl = !hasSectionEmbeds ? embedUrl : undefined;

  const snapshot = useMemo(
    () => buildSnapshot(range, customStart, customEnd),
    [range, customStart, customEnd],
  );

  const customError = getCustomError(range, customStart, customEnd, today);

  const selectRange = (next: DateRangeKey) => {
    if (next === 'custom' && (!customStart || !customEnd)) {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 13);
      setCustomStart(formatInputDate(start));
      setCustomEnd(formatInputDate(end));
    }
    setRange(next);
  };

  const handleExport = () => {
    if (!snapshot) {
      toast.error('Selecciona un rango válido para exportar el reporte.');
      return;
    }

    downloadReport(snapshot);
    toast.success('Reporte preliminar descargado.');
  };

  return (
    <div className="min-h-screen bg-slate-50 py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Analítica y Rendimiento del Negocio
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-500 sm:text-base">
              Sigue búsquedas, consultas y reservas para decidir qué experiencias impulsar, ajustar o promocionar.
            </p>
          </div>

          <div className="flex flex-col items-stretch gap-3 sm:items-end">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div
                className="inline-flex max-w-full overflow-x-auto rounded-full border border-slate-200 bg-white p-1 shadow-sm"
                role="group"
                aria-label="Rango de fechas"
              >
                {RANGE_OPTIONS.map((option) => {
                  const active = range === option.key;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      aria-pressed={active}
                      onClick={() => selectRange(option.key)}
                      className={cn(
                        'whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                        active
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-600 hover:bg-slate-50',
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleExport}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
              >
                <FileDown className="h-4 w-4" />
                Exportar reporte
              </button>
            </div>

            {range === 'custom' && (
              <div className="flex flex-wrap items-end gap-3">
                <DateField
                  id="analytics-start"
                  label="Desde"
                  value={customStart}
                  max={customEnd || today}
                  onChange={setCustomStart}
                />
                <DateField
                  id="analytics-end"
                  label="Hasta"
                  value={customEnd}
                  min={customStart}
                  max={today}
                  onChange={setCustomEnd}
                />
              </div>
            )}

            <p className="text-xs text-slate-500" aria-live="polite">
              {snapshot
                ? `Periodo visible: ${snapshot.rangeLabel}`
                : customError || 'Elige las fechas del reporte.'}
            </p>
          </div>
        </header>

        <div className="mb-6 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/80 px-4 py-3 text-sm text-blue-950">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
          <p>
            {fullEmbedUrl || hasSectionEmbeds
              ? 'El reporte embebido usa los controles de Looker Studio. El rango seleccionado aplica a las tarjetas de resumen y a la vista previa.'
              : 'Vista previa con datos de ejemplo. Cuando Looker Studio esté listo, estas tarjetas mostrarán el reporte real sin cambiar la interfaz.'}
          </p>
        </div>

        {snapshot && (
          <p className="sr-only">
            {`En ${snapshot.rangeLabel} hubo ${formatNumber(snapshot.views.value)} visualizaciones, ${formatNumber(snapshot.bookings.value)} reservas confirmadas, una tasa de conversión de ${formatPercent(snapshot.conversion.value)} e ingresos estimados de ${formatCurrency(snapshot.revenue.value)}.`}
          </p>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpiConfig.map((item) => (
            <KpiCard
              key={item.id}
              label={item.label}
              hint={item.hint}
              icon={item.icon}
              iconClass={item.iconClass}
              stroke={item.stroke}
              metric={snapshot?.[item.id]}
              format={item.format}
              title={'title' in item && snapshot ? item.title(snapshot[item.id].value) : undefined}
              isLoading={isLoading && !snapshot}
            />
          ))}
        </div>

        {snapshot && (
          <p className="mb-6 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
            {snapshot.insight}
            {snapshot.biggestDrop && (
              <>
                {' '}
                La mayor pérdida de viajeros ocurre entre {snapshot.biggestDrop.from} y {snapshot.biggestDrop.to}
                {' '}
                ({formatNumber(snapshot.biggestDrop.lost)} personas, {formatPercent(snapshot.biggestDrop.percent)}).
              </>
            )}
          </p>
        )}

        {customError && !snapshot ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-sm text-slate-500">
            {customError}
          </div>
        ) : fullEmbedUrl ? (
          <LookerEmbedContainer
            title="Reporte de rendimiento"
            description="Visualización completa conectada a Looker Studio."
            embedUrl={fullEmbedUrl}
            isLoading={isLoading}
          >
            <span className="sr-only">Reporte embebido</span>
          </LookerEmbedContainer>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <LookerEmbedContainer
              className="lg:col-span-2"
              title="Rendimiento de reservas e ingresos"
              description="Eje izquierdo: reservas confirmadas. Eje derecho: ingresos estimados."
              embedUrl={resolvedEmbeds.performance}
              isLoading={isLoading}
            >
              {snapshot && <PerformanceChart snapshot={snapshot} />}
            </LookerEmbedContainer>

            <LookerEmbedContainer
              title="Experiencias y servicios más consultados"
              description="Prioriza inventario y promoción en las actividades con más consultas."
              embedUrl={resolvedEmbeds.topServices}
              isLoading={isLoading}
            >
              {snapshot && <TopServicesChart snapshot={snapshot} />}
            </LookerEmbedContainer>

            <LookerEmbedContainer
              title="Comportamiento e interacciones de usuarios"
              description="Del hallazgo a la reserva: búsquedas, clics y en qué paso se pierden."
              embedUrl={resolvedEmbeds.behavior}
              isLoading={isLoading}
            >
              {snapshot && <BehaviorChart snapshot={snapshot} />}
            </LookerEmbedContainer>
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({
  label,
  hint,
  icon: Icon,
  iconClass,
  stroke,
  metric,
  format,
  title,
  isLoading,
}: {
  label: string;
  hint: string;
  icon: typeof Eye;
  iconClass: string;
  stroke: string;
  metric?: KpiMetric;
  format: (value: number) => string;
  title?: string;
  isLoading: boolean;
}) {
  const change = metric?.change ?? 0;
  const positive = change > 0;
  const neutral = Math.abs(change) < 0.05;
  const TrendIcon = neutral ? Minus : positive ? ArrowUpRight : ArrowDownRight;

  return (
    <article className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-xs text-slate-400">{hint}</p>
        </div>
        <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl', iconClass)}>
          <Icon className="h-5 w-5" />
        </span>
      </div>

      {isLoading || !metric ? (
        <div className="mt-5 h-9 w-28 animate-pulse rounded-md bg-slate-100" />
      ) : (
        <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 tabular-nums" title={title}>
          {format(metric.value)}
        </p>
      )}

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
              neutral && 'bg-slate-100 text-slate-600',
              !neutral && positive && 'bg-emerald-50 text-emerald-700',
              !neutral && !positive && 'bg-rose-50 text-rose-700',
            )}
          >
            <TrendIcon className="h-3.5 w-3.5" />
            {metric ? `${positive && !neutral ? '+' : ''}${formatPercent(change)}` : '—'}
          </span>
          <p className="mt-1.5 text-xs text-slate-400">vs. periodo anterior</p>
        </div>
        {metric && <Sparkline values={metric.series} color={stroke} />}
      </div>
    </article>
  );
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;

  const width = 96;
  const height = 36;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / span) * (height - 6) - 3;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-9 w-24 shrink-0" aria-hidden="true">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  );
}

function DateField({
  id,
  label,
  value,
  min,
  max,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  min?: string;
  max?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1 text-xs font-medium text-slate-500">
      {label}
      <input
        id={id}
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}

function getCustomError(
  range: DateRangeKey,
  start: string,
  end: string,
  today: string,
) {
  if (range !== 'custom' || !start || !end) return null;
  if (start > end) return 'La fecha inicial no puede ser posterior a la final.';
  if (end > today) return 'El rango no puede incluir fechas futuras.';
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  const days = Math.round((endDate.getTime() - startDate.getTime()) / 86400000);
  if (days > 365) return 'El rango personalizado admite hasta 365 días.';
  return null;
}

function cleanUrl(value?: string) {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function downloadReport(snapshot: AnalyticsSnapshot) {
  const rows = [
    ['Métrica', 'Valor', 'Periodo anterior', 'Cambio'],
    ['Visualizaciones', String(Math.round(snapshot.views.value)), String(Math.round(snapshot.views.previous)), formatPercent(snapshot.views.change)],
    ['Reservas confirmadas', String(Math.round(snapshot.bookings.value)), String(Math.round(snapshot.bookings.previous)), formatPercent(snapshot.bookings.change)],
    ['Tasa de conversión', formatPercent(snapshot.conversion.value), formatPercent(snapshot.conversion.previous), formatPercent(snapshot.conversion.change)],
    ['Ingresos estimados', formatCurrency(snapshot.revenue.value), formatCurrency(snapshot.revenue.previous), formatPercent(snapshot.revenue.change)],
    [],
    ['Fecha', 'Búsquedas', 'Visualizaciones', 'Clics', 'Reservas', 'Ingresos'],
    ...snapshot.series.map((point) => [
      point.label,
      String(point.searches),
      String(point.views),
      String(point.clicks),
      String(point.bookings),
      String(point.revenue),
    ]),
    [],
    ['Servicio', 'Consultas', 'Reservas', 'Consulta a reserva'],
    ...snapshot.services.map((service) => [
      service.name,
      String(service.views),
      String(service.bookings),
      formatPercent(service.conversion),
    ]),
  ];

  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `wts-analitica-${formatInputDate(new Date())}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
