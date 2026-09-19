import { useId } from 'react';
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  formatCompactCurrency,
  formatCurrency,
  formatNumber,
  formatPercent,
  type AnalyticsSnapshot,
} from '@/features/provider/analytics/analyticsPreview';

const tooltipStyle = {
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
  fontSize: 12,
};

export function PerformanceChart({ snapshot }: { snapshot: AnalyticsSnapshot }) {
  const gradientId = useId().replace(/:/g, '');

  return (
    <div className="flex h-[400px] flex-col">
      <div className="mb-3 flex flex-wrap gap-4 text-xs text-slate-500">
        <span className="inline-flex items-center gap-2">
          <span className="h-0.5 w-4 rounded-full bg-blue-700" />
          Reservas
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-4 rounded-sm bg-blue-200" />
          Ingresos
        </span>
      </div>
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={snapshot.series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="axisLabel"
            tick={{ fill: '#64748b', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
          />
          <YAxis
            yAxisId="bookings"
            tick={{ fill: '#64748b', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={36}
            allowDecimals={false}
          />
          <YAxis
            yAxisId="revenue"
            orientation="right"
            tick={{ fill: '#64748b', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={64}
            tickFormatter={(value: number) => formatCompactCurrency(value)}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value, name) => {
              const amount = Number(value ?? 0);
              if (name === 'Ingresos') return [formatCurrency(amount), name];
              return [formatNumber(amount), name];
            }}
            labelFormatter={(_, payload) => {
              const point = payload?.[0]?.payload as { label?: string } | undefined;
              return point?.label ?? '';
            }}
          />
          <Area
            yAxisId="revenue"
            type="monotone"
            dataKey="revenue"
            name="Ingresos"
            stroke="#93c5fd"
            strokeWidth={2}
            fill={`url(#${gradientId})`}
          />
          <Line
            yAxisId="bookings"
            type="monotone"
            dataKey="bookings"
            name="Reservas"
            stroke="#1d4ed8"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, fill: '#1d4ed8' }}
          />
        </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function TopServicesChart({ snapshot }: { snapshot: AnalyticsSnapshot }) {
  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={snapshot.services}
          layout="vertical"
          margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
        >
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: '#64748b', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: number) => formatNumber(value)}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={164}
            tick={{ fill: '#334155', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value, name) => [formatNumber(Number(value ?? 0)), name]}
            labelFormatter={(_, payload) => {
              const service = payload?.[0]?.payload as {
                name?: string;
                bookings?: number;
                conversion?: number;
              } | undefined;

              if (!service) return '';
              return `${service.name} · ${formatNumber(service.bookings ?? 0)} reservas · ${formatPercent(service.conversion ?? 0)} consulta a reserva`;
            }}
          />
          <Bar dataKey="views" name="Consultas" radius={[0, 8, 8, 0]} barSize={18} fill="#2563eb" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BehaviorChart({ snapshot }: { snapshot: AnalyticsSnapshot }) {
  const max = snapshot.funnel[0]?.value || 1;

  return (
    <div className="grid min-h-[400px] gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(220px,0.9fr)]">
      <ol className="flex flex-col justify-center gap-3">
        {snapshot.funnel.map((stage) => (
          <li key={stage.key}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium text-slate-700">{stage.label}</span>
              <span className="text-sm tabular-nums text-slate-900">
                {formatNumber(stage.value)}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.max((stage.value / max) * 100, 4)}%`,
                  backgroundColor: stage.color,
                }}
              />
            </div>
            {stage.dropOff != null && (
              <p className="mt-1 text-xs text-slate-500">
                {formatPercent(stage.dropOff)} no continúa desde la etapa anterior
              </p>
            )}
          </li>
        ))}
      </ol>

      <div className="flex flex-col items-center justify-center">
        <div className="relative h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={snapshot.behaviorSlices}
                dataKey="value"
                nameKey="name"
                innerRadius={62}
                outerRadius={88}
                paddingAngle={2}
                stroke="none"
              >
                {snapshot.behaviorSlices.map((slice) => (
                  <Cell key={slice.name} fill={slice.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value, name) => [formatNumber(Number(value ?? 0)), name]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-semibold tabular-nums text-slate-900">
              {formatPercent(snapshot.conversion.value)}
            </span>
            <span className="text-[11px] text-slate-500">clic a reserva</span>
          </div>
        </div>
        <ul className="mt-2 grid w-full gap-1.5">
          {snapshot.behaviorSlices.map((slice) => (
            <li key={slice.name} className="flex items-center justify-between gap-3 text-xs text-slate-600">
              <span className="inline-flex min-w-0 items-center gap-2">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: slice.color }}
                  aria-hidden="true"
                />
                <span className="truncate">{slice.name}</span>
              </span>
              <span className="tabular-nums">{formatNumber(slice.value)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
