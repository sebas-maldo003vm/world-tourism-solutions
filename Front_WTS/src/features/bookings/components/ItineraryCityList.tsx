import { Card, CardContent } from '@/shared/components/ui/card';
import { Clock, MapPin } from 'lucide-react';
import type { Booking, ItineraryCityGroup } from '@/features/bookings/types';
import { formatClock, formatItineraryDate, isPastTravel } from '@/features/bookings/utils/itinerary';

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  default: { bg: '#E6F1FB', text: '#0C447C' },
  Actividades: { bg: '#E1F5EE', text: '#085041' },
  Tour: { bg: '#EEEDFE', text: '#3C3489' },
  Restaurantes: { bg: '#FAEEDA', text: '#633806' },
  Alojamiento: { bg: '#FAECE7', text: '#712B13' },
  Transporte: { bg: '#F1EFE8', text: '#444441' },
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Confirmada',
  COMPLETED: 'Completada',
  REJECTED: 'Rechazada',
  CANCELLED: 'Cancelada',
};

function categoryColor(category?: string) {
  if (!category) return CATEGORY_COLORS.default;
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.default;
}

function statusClass(status?: string, past = false) {
  const normalized = String(status || '').toUpperCase();
  if (past || normalized === 'COMPLETED') return 'bg-slate-100 text-slate-700';
  if (normalized === 'APPROVED') return 'bg-green-100 text-green-700';
  if (normalized === 'PENDING') return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-700';
}

function BookingCard({ booking, index }: { booking: Booking; index: number }) {
  const catColor = categoryColor(booking.businessCategory);
  const start = formatClock(booking.startTime);
  const end = formatClock(booking.endTime);
  const past = isPastTravel(booking);
  const status = String(booking.status || 'PENDING').toUpperCase();

  return (
    <div className="flex gap-5 relative">
      <div className="flex flex-col items-center flex-shrink-0 z-10">
        <div
          className={`w-8 h-8 rounded-full bg-white border-2 flex items-center justify-center font-semibold text-sm ${
            past ? 'border-amber-400 text-amber-700' : 'border-blue-400 text-blue-600'
          }`}
        >
          {index + 1}
        </div>
      </div>

      <Card className="flex-1 hover:shadow-md transition-shadow border border-gray-100 mb-1">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="font-semibold text-base text-gray-800 leading-snug">
              {booking.businessName}
            </h3>
            <span
              className="flex-shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium"
              style={{ backgroundColor: catColor.bg, color: catColor.text }}
            >
              {booking.businessCategory || 'Sin categoría'}
            </span>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-gray-500">
            <span>{formatItineraryDate(booking.bookingDate)}</span>
            {(start || end) && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 flex-shrink-0" />
                {start && end ? `${start} – ${end}` : start ? `Desde ${start}` : `Hasta ${end}`}
              </span>
            )}
            {(booking.businessAddress || booking.businessCity) && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                {[booking.businessAddress, booking.businessCity].filter(Boolean).join(', ')}
              </span>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusClass(status, past)}`}>
              {past && status !== 'COMPLETED' ? 'Pasada' : STATUS_LABEL[status] || status}
            </span>
            <span className="text-xs text-gray-400">
              {booking.numPeople} {booking.numPeople === 1 ? 'persona' : 'personas'} · $
              {Number(booking.totalPrice).toLocaleString('es-CO')}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function ItineraryCityList({ groups }: { groups: ItineraryCityGroup[] }) {
  return (
    <div className="space-y-10">
      {groups.map((group) => (
        <section key={group.city}>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <MapPin className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">{group.city}</h2>
            <span className="ml-auto text-sm text-gray-400">
              {group.bookings.length} {group.bookings.length === 1 ? 'reserva' : 'reservas'}
            </span>
          </div>

          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
            <div className="space-y-4">
              {group.bookings.map((booking, index) => (
                <BookingCard key={booking.id} booking={booking} index={index} />
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
