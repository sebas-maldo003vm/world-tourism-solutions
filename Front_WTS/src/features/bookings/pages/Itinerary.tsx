import { es } from 'date-fns/locale';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Calendar, Loader2, X } from 'lucide-react';
import { DayProposalPanel } from '@/features/bookings/components/DayProposalPanel';
import { ItineraryCalendarPanel } from '@/features/bookings/components/ItineraryCalendarPanel';
import { ItineraryCityList } from '@/features/bookings/components/ItineraryCityList';
import { useItineraryCalendar } from '@/features/bookings/hooks/useItineraryCalendar';
import type { ItineraryPeriod } from '@/features/bookings/types';
import { FEEDBACK_STORAGE_KEYS, FeedbackPrompt } from '@/shared/components/feedback/FeedbackPrompt';

const PERIOD_COPY: Record<ItineraryPeriod, string> = {
  all: 'Reservas activas y viajes ya realizados, agrupados por ciudad.',
  active: 'Reservas pendientes y confirmadas que aún están por suceder.',
  past: 'Historial de viajes ya realizados, agrupados por ciudad.',
};

export function Itinerary() {
  const navigate = useNavigate();
  const {
    schedule,
    visibleGroups,
    selectedDate,
    period,
    loading,
    dayLoading,
    error,
    dayError,
    dateMarks,
    counts,
    loadSchedule,
    selectDate,
    changePeriod,
    clearDate,
  } = useItineraryCalendar();

  const heading = selectedDate
    ? format(selectedDate, "EEEE d 'de' MMMM yyyy", { locale: es }).replace(/^\w/, (letter) =>
        letter.toUpperCase(),
      )
    : period === 'past'
      ? 'Historial de viajes'
      : period === 'active'
        ? 'Reservas activas'
        : 'Todos tus planes';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Mi itinerario</h1>
          <p className="text-gray-500 text-sm">
            Consulta reservas activas y planes pasados. Elige una fecha del calendario para filtrar por día.
            Las propuestas de un día quedan aparte y no se mezclan con estas reservas.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-gray-500">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Cargando tu itinerario...</span>
          </div>
        ) : error && schedule.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 p-10 text-gray-500">
              <p>{error}</p>
              <Button onClick={() => void loadSchedule()} variant="outline" className="rounded-full">
                Reintentar
              </Button>
            </CardContent>
          </Card>
        ) : (
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] items-start">
          <ItineraryCalendarPanel
            selectedDate={selectedDate}
            period={period}
            dateMarks={dateMarks}
            counts={counts}
            onSelectDate={(date) => void selectDate(date)}
            onChangePeriod={changePeriod}
          />

          <div>
            <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">{heading}</h2>
                <p className="text-sm text-gray-500">
                  {selectedDate
                    ? 'Itinerario de ese día, agrupado por ciudad.'
                    : PERIOD_COPY[period]}
                </p>
              </div>
              {selectedDate && (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={clearDate}
                >
                  <X className="h-4 w-4" />
                  Quitar fecha
                </Button>
              )}
            </div>

            {dayLoading ? (
              <div className="flex items-center gap-3 text-gray-500 py-16 justify-center">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Buscando planes de esa fecha...</span>
              </div>
            ) : dayError ? (
              <Card>
                <CardContent className="p-10 text-center">
                  <p className="text-gray-500 mb-4">{dayError}</p>
                  <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={() => selectedDate && void selectDate(selectedDate)}
                  >
                    Reintentar
                  </Button>
                </CardContent>
              </Card>
            ) : visibleGroups.length === 0 ? (
              <Card>
                <CardContent className="p-16 text-center">
                  <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 mb-6">
                    {selectedDate
                      ? 'No hay reservas para esta fecha.'
                      : period === 'past'
                        ? 'Todavía no tienes viajes en el historial.'
                        : period === 'active'
                          ? 'No tienes reservas activas.'
                          : 'No tienes reservas activas ni viajes anteriores.'}
                  </p>
                  {!selectedDate && period !== 'past' && (
                    <Button
                      onClick={() => navigate('/home-logueado')}
                      className="bg-blue-600 hover:bg-blue-700 rounded-full"
                    >
                      Explorar servicios
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <ItineraryCityList groups={visibleGroups} />
            )}
          </div>
        </div>
        )}

        <DayProposalPanel />
      </div>

      <FeedbackPrompt open storageKey={FEEDBACK_STORAGE_KEYS.itinerary} />
    </div>
  );
}
