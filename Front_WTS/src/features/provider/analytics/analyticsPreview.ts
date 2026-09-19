import {
  differenceInCalendarDays,
  eachDayOfInterval,
  format,
  startOfDay,
  startOfMonth,
  subDays,
} from 'date-fns';
import { es } from 'date-fns/locale';

export type DateRangeKey = 'last7' | 'last30' | 'thisMonth' | 'custom';

export interface DailyPoint {
  date: string;
  axisLabel: string;
  label: string;
  searches: number;
  views: number;
  clicks: number;
  bookings: number;
  revenue: number;
}

export interface ServiceMetric {
  name: string;
  views: number;
  bookings: number;
  conversion: number;
}

export interface FunnelStage {
  key: string;
  label: string;
  value: number;
  color: string;
  dropOff: number | null;
}

export interface BehaviorSlice {
  name: string;
  value: number;
  color: string;
}

export interface KpiMetric {
  value: number;
  previous: number;
  change: number;
  series: number[];
}

export interface AnalyticsSnapshot {
  rangeLabel: string;
  startLabel: string;
  endLabel: string;
  views: KpiMetric;
  bookings: KpiMetric;
  conversion: KpiMetric;
  revenue: KpiMetric;
  series: DailyPoint[];
  services: ServiceMetric[];
  funnel: FunnelStage[];
  behaviorSlices: BehaviorSlice[];
  insight: string;
  biggestDrop: { from: string; to: string; lost: number; percent: number } | null;
}

const SERVICES = [
  { name: 'City tour histórico', viewShare: 0.26, conversion: 0.062 },
  { name: 'Senderismo al mirador', viewShare: 0.18, conversion: 0.041 },
  { name: 'Tour gastronómico', viewShare: 0.16, conversion: 0.055 },
  { name: 'Avistamiento de aves', viewShare: 0.15, conversion: 0.038 },
  { name: 'Paseo en lancha', viewShare: 0.14, conversion: 0.049 },
  { name: 'Taller de artesanías', viewShare: 0.11, conversion: 0.033 },
] as const;

const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const compactCurrencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const numberFormatter = new Intl.NumberFormat('es-CO');

const percentFormatter = new Intl.NumberFormat('es-CO', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export const RANGE_OPTIONS: { key: DateRangeKey; label: string }[] = [
  { key: 'last7', label: 'Últimos 7 días' },
  { key: 'last30', label: 'Últimos 30 días' },
  { key: 'thisMonth', label: 'Este mes' },
  { key: 'custom', label: 'Personalizado' },
];

export function formatNumber(value: number) {
  return numberFormatter.format(Math.round(value));
}

export function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

export function formatCompactCurrency(value: number) {
  return compactCurrencyFormatter.format(value);
}

export function formatPercent(value: number) {
  return `${percentFormatter.format(value)}%`;
}

export function formatInputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function buildSnapshot(
  range: DateRangeKey,
  customStart?: string,
  customEnd?: string,
): AnalyticsSnapshot | null {
  const current = resolveRange(range, customStart, customEnd);
  if (!current) return null;

  const dayCount = differenceInCalendarDays(current.end, current.start) + 1;
  const previousEnd = subDays(current.start, 1);
  const previousStart = subDays(previousEnd, dayCount - 1);

  const currentDays = buildDailyPoints(current.start, current.end);
  const previousDays = buildDailyPoints(previousStart, previousEnd);
  const series = bucketSeries(currentDays);

  const views = sum(currentDays, 'views');
  const bookings = sum(currentDays, 'bookings');
  const clicks = sum(currentDays, 'clicks');
  const searches = sum(currentDays, 'searches');
  const revenue = sum(currentDays, 'revenue');

  const previousViews = sum(previousDays, 'views');
  const previousBookings = sum(previousDays, 'bookings');
  const previousClicks = sum(previousDays, 'clicks');
  const previousRevenue = sum(previousDays, 'revenue');

  const conversion = clicks === 0 ? 0 : (bookings / clicks) * 100;
  const previousConversion =
    previousClicks === 0 ? 0 : (previousBookings / previousClicks) * 100;

  const services = buildServices(views, bookings);
  const top = services[0];
  const topShare = views === 0 ? 0 : (top.views / views) * 100;

  return {
    rangeLabel: formatRangeLabel(current.start, current.end),
    startLabel: formatLongDate(current.start),
    endLabel: formatLongDate(current.end),
    views: toKpi(views, previousViews, series.map((point) => point.views)),
    bookings: toKpi(bookings, previousBookings, series.map((point) => point.bookings)),
    conversion: toKpi(
      conversion,
      previousConversion,
      series.map((point) =>
        point.clicks === 0 ? 0 : (point.bookings / point.clicks) * 100,
      ),
    ),
    revenue: toKpi(revenue, previousRevenue, series.map((point) => point.revenue)),
    series,
    services,
    funnel: buildFunnel(searches, views, clicks, bookings),
    behaviorSlices: buildBehaviorSlices(searches, views, clicks, bookings),
    insight: `${top.name} concentra el ${formatPercent(topShare)} de las consultas. De quienes lo vieron, el ${formatPercent(top.conversion)} llegó a reservar.`,
    biggestDrop: largestDrop(searches, views, clicks, bookings),
  };
}

function resolveRange(
  range: DateRangeKey,
  customStart?: string,
  customEnd?: string,
) {
  const today = startOfDay(new Date());

  if (range === 'last7') {
    return { start: subDays(today, 6), end: today };
  }

  if (range === 'last30') {
    return { start: subDays(today, 29), end: today };
  }

  if (range === 'thisMonth') {
    return { start: startOfMonth(today), end: today };
  }

  if (!customStart || !customEnd) return null;

  const start = parseLocalDate(customStart);
  const end = parseLocalDate(customEnd);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  if (start > end || end > today) return null;
  if (differenceInCalendarDays(end, start) > 365) return null;

  return { start, end };
}

function parseLocalDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return startOfDay(new Date(year, (month || 1) - 1, day || 1));
}

function buildDailyPoints(start: Date, end: Date): DailyPoint[] {
  return eachDayOfInterval({ start, end }).map((date) => {
    const iso = formatInputDate(date);
    const weekend = date.getDay() === 0 || date.getDay() === 6;
    const wave = 0.86 + unit(`${iso}-wave`) * 0.28;
    const searches = Math.round((weekend ? 760 : 540) * wave);
    const views = Math.round(searches * (0.62 + unit(`${iso}-views`) * 0.08));
    const clicks = Math.round(views * (0.28 + unit(`${iso}-clicks`) * 0.06));
    const bookings = Math.max(0, Math.round(clicks * (0.042 + unit(`${iso}-book`) * 0.018)));
    const ticket = 165000 + Math.round(unit(`${iso}-ticket`) * 110000);

    return {
      date: iso,
      axisLabel: format(date, 'd MMM', { locale: es }),
      label: formatLongDate(date),
      searches,
      views,
      clicks,
      bookings,
      revenue: bookings * ticket,
    };
  });
}

function bucketSeries(days: DailyPoint[]): DailyPoint[] {
  if (days.length <= 31) return days;

  const buckets: DailyPoint[] = [];

  for (let index = 0; index < days.length; index += 7) {
    const chunk = days.slice(index, index + 7);
    const first = chunk[0];
    const last = chunk[chunk.length - 1];

    buckets.push({
      date: first.date,
      axisLabel: first.axisLabel,
      label: chunk.length === 1 ? first.label : `${first.label} – ${last.label}`,
      searches: sum(chunk, 'searches'),
      views: sum(chunk, 'views'),
      clicks: sum(chunk, 'clicks'),
      bookings: sum(chunk, 'bookings'),
      revenue: sum(chunk, 'revenue'),
    });
  }

  return buckets;
}

function buildServices(totalViews: number, totalBookings: number): ServiceMetric[] {
  const views = distribute(totalViews, SERVICES.map((service) => service.viewShare));
  const weighted = SERVICES.map((service, index) => views[index] * service.conversion);
  const weightTotal = weighted.reduce((total, value) => total + value, 0) || 1;
  const bookings = distribute(
    totalBookings,
    weighted.map((value) => value / weightTotal),
  );

  return SERVICES.map((service, index) => ({
    name: service.name,
    views: views[index],
    bookings: bookings[index],
    conversion: views[index] === 0 ? 0 : (bookings[index] / views[index]) * 100,
  })).sort((left, right) => right.views - left.views);
}

function buildFunnel(
  searches: number,
  views: number,
  clicks: number,
  bookings: number,
): FunnelStage[] {
  const stages = [
    { key: 'searches', label: 'Búsquedas', value: searches, color: '#64748b' },
    { key: 'views', label: 'Visualizaciones', value: views, color: '#0ea5e9' },
    { key: 'clicks', label: 'Clics en reservar', value: clicks, color: '#2563eb' },
    { key: 'bookings', label: 'Reservas confirmadas', value: bookings, color: '#059669' },
  ];

  return stages.map((stage, index) => {
    const previous = stages[index - 1];
    const dropOff =
      !previous || previous.value === 0
        ? null
        : ((previous.value - stage.value) / previous.value) * 100;

    return { ...stage, dropOff };
  });
}

function buildBehaviorSlices(
  searches: number,
  views: number,
  clicks: number,
  bookings: number,
): BehaviorSlice[] {
  return [
    { name: 'Buscó y no consultó', value: Math.max(searches - views, 0), color: '#94a3b8' },
    { name: 'Consultó sin hacer clic', value: Math.max(views - clicks, 0), color: '#38bdf8' },
    { name: 'Hizo clic sin reservar', value: Math.max(clicks - bookings, 0), color: '#2563eb' },
    { name: 'Reservó', value: bookings, color: '#059669' },
  ].filter((slice) => slice.value > 0);
}

function largestDrop(
  searches: number,
  views: number,
  clicks: number,
  bookings: number,
) {
  const steps = [
    { from: 'búsqueda', to: 'visualización', current: views, previous: searches },
    { from: 'visualización', to: 'clic', current: clicks, previous: views },
    { from: 'clic', to: 'reserva', current: bookings, previous: clicks },
  ];

  const ranked = steps
    .filter((step) => step.previous > 0)
    .map((step) => ({
      from: step.from,
      to: step.to,
      lost: step.previous - step.current,
      percent: ((step.previous - step.current) / step.previous) * 100,
    }))
    .sort((left, right) => right.lost - left.lost);

  return ranked[0] ?? null;
}

function toKpi(value: number, previous: number, series: number[]): KpiMetric {
  const change = previous === 0 ? (value === 0 ? 0 : 100) : ((value - previous) / previous) * 100;
  return { value, previous, change, series };
}

function distribute(total: number, shares: number[]) {
  const raw = shares.map((share) => Math.floor(total * share));
  let remainder = total - raw.reduce((sumValue, value) => sumValue + value, 0);
  let index = 0;

  while (remainder > 0) {
    raw[index % raw.length] += 1;
    remainder -= 1;
    index += 1;
  }

  return raw;
}

function sum<T extends object>(points: T[], key: keyof T) {
  return points.reduce((total, point) => total + Number(point[key]), 0);
}

function formatLongDate(date: Date) {
  return format(date, "d 'de' MMMM yyyy", { locale: es });
}

function formatRangeLabel(start: Date, end: Date) {
  const sameYear = start.getFullYear() === end.getFullYear();
  const startLabel = format(start, sameYear ? 'd MMM' : 'd MMM yyyy', { locale: es });
  const endLabel = format(end, 'd MMM yyyy', { locale: es });
  return `${startLabel} – ${endLabel}`;
}

function unit(seed: string) {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  const value = Math.sin(hash) * 10000;
  return value - Math.floor(value);
}
