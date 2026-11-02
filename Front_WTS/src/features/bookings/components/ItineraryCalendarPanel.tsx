import type { DayContentProps } from 'react-day-picker';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';
import { Calendar } from '@/shared/components/ui/calendar';
import type { ItineraryPeriod, TravelDateMark } from '@/features/bookings/types';

const PERIODS: { id: ItineraryPeriod; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'active', label: 'Activas' },
  { id: 'past', label: 'Historial' },
];

const MARK_CLASS: Record<TravelDateMark, string> = {
  active: 'bg-blue-600',
  past: 'bg-amber-500',
  mixed: 'bg-violet-500',
};

interface ItineraryCalendarPanelProps {
  selectedDate?: Date;
  period: ItineraryPeriod;
  dateMarks: Record<string, TravelDateMark>;
  counts: { total: number; active: number; past: number };
  onSelectDate: (date: Date | undefined) => void;
  onChangePeriod: (period: ItineraryPeriod) => void;
}

export function ItineraryCalendarPanel({
  selectedDate,
  period,
  dateMarks,
  counts,
  onSelectDate,
  onChangePeriod,
}: ItineraryCalendarPanelProps) {
  return (
    <section className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-gray-800">Calendario de viajes</h2>
        <p className="text-xs text-gray-500 mt-1">
          Abre un mes anterior y elige un día para ver ese plan.
        </p>
      </div>

      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={onSelectDate}
        locale={es}
        className="p-0 w-full"
        classNames={{
          months: 'flex flex-col w-full',
          month: 'flex flex-col gap-3 w-full',
          caption: 'flex justify-center pt-1 relative items-center w-full',
          caption_label: 'text-sm font-semibold capitalize text-gray-800',
          nav_button_previous: 'absolute left-1',
          nav_button_next: 'absolute right-1',
          head_row: 'flex w-full',
          head_cell: 'text-gray-400 flex-1 font-normal text-[0.75rem]',
          row: 'flex w-full mt-1',
          cell: 'relative p-0 text-center text-sm flex-1 focus-within:relative focus-within:z-20 [&:has([aria-selected])]:rounded-md',
          day: 'inline-flex items-center justify-center rounded-md h-10 w-10 p-0 font-normal mx-auto text-gray-700 hover:bg-blue-50 aria-selected:opacity-100',
          day_selected:
            'bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white',
          day_today: 'bg-blue-50 text-blue-700 font-semibold',
          day_outside: 'text-gray-300',
        }}
        components={{
          DayContent: (props: DayContentProps) => (
            <TravelDayContent {...props} dateMarks={dateMarks} />
          ),
        }}
      />

      <ul className="mt-4 space-y-1.5 text-xs text-gray-500">
        <li className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
          Activas o próximas ({counts.active})
        </li>
        <li className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          Viajes pasados ({counts.past})
        </li>
      </ul>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Periodo del itinerario">
        {PERIODS.map((item) => {
          const selected = !selectedDate && period === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onChangePeriod(item.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                selected
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <p className="mt-3 text-xs text-blue-700">
          Día seleccionado: {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
        </p>
      )}
    </section>
  );
}

function TravelDayContent({
  date,
  activeModifiers,
  dateMarks,
}: DayContentProps & { dateMarks: Record<string, TravelDateMark> }) {
  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const mark = dateMarks[key];
  const dotClass = activeModifiers.selected ? 'bg-white' : mark ? MARK_CLASS[mark] : '';

  return (
    <span className="relative inline-flex h-full w-full items-center justify-center">
      {date.getDate()}
      {mark && (
        <span className={`absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full ${dotClass}`} />
      )}
    </span>
  );
}
