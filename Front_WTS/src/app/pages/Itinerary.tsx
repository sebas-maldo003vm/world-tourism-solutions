import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { MapPin, Clock, Tag, Calendar, Loader2 } from 'lucide-react';
import { api } from '../Services/api';

interface BookingItem {
  id: number;
  bookingDate: string;
  startTime: string | null;
  endTime: string | null;
  numPeople: number;
  totalPrice: number;
  status: string;
  businessId: number;
  businessName: string;
  businessCity: string;
  businessAddress: string;
  businessCategory: string;
}

interface CityGroup {
  city: string;
  bookings: BookingItem[];
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  default: { bg: '#E6F1FB', text: '#0C447C' },
  Actividades: { bg: '#E1F5EE', text: '#085041' },
  Tour: { bg: '#EEEDFE', text: '#3C3489' },
  Restaurantes: { bg: '#FAEEDA', text: '#633806' },
  Alojamiento: { bg: '#FAECE7', text: '#712B13' },
  Transporte: { bg: '#F1EFE8', text: '#444441' },
};

function getCategoryColor(category: string) {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.default;
}

function formatTime(time: string | null) {
  if (!time) return null;
  return time.slice(0, 5);
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-');
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function Itinerary() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<CityGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    loadItinerary();
  }, []);

  const loadItinerary = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/bookings/itinerary');
      setGroups(response.data);
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          'No se pudo cargar el itinerario. Intenta de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gap-3 text-gray-500">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span>Cargando tu itinerario...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-gray-500">
        <p>{error}</p>
        <Button onClick={loadItinerary} variant="outline" className="rounded-full">
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Mi Itinerario</h1>
          <p className="text-gray-500 text-sm">
            Tus reservas activas agrupadas por destino, ordenadas por fecha y hora
          </p>
        </div>

        {groups.length === 0 ? (
          <Card>
            <CardContent className="p-16 text-center">
              <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-6">No tienes reservas activas aún</p>
              <Button
                onClick={() => navigate('/')}
                className="bg-blue-600 hover:bg-blue-700 rounded-full"
              >
                Explorar servicios
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-10">
            {groups.map((group) => (
              <section key={group.city}>
                {/* Encabezado de ciudad */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-4 w-4 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800">{group.city}</h2>
                  <span className="ml-auto text-sm text-gray-400">
                    {group.bookings.length}{' '}
                    {group.bookings.length === 1 ? 'reserva' : 'reservas'}
                  </span>
                </div>

                {/* Timeline de actividades */}
                <div className="relative">
                  {/* Línea vertical */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

                  <div className="space-y-4">
                    {group.bookings.map((booking, index) => {
                      const catColor = getCategoryColor(booking.businessCategory);
                      const start = formatTime(booking.startTime);
                      const end = formatTime(booking.endTime);
                      const isLast = index === group.bookings.length - 1;

                      return (
                        <div key={booking.id} className="flex gap-5 relative">
                          {/* Nodo del timeline */}
                          <div className="flex flex-col items-center flex-shrink-0 z-10">
                            <div className="w-8 h-8 rounded-full bg-white border-2 border-blue-400 flex items-center justify-center text-blue-600 font-semibold text-sm">
                              {index + 1}
                            </div>
                          </div>

                          {/* Tarjeta */}
                          <Card className="flex-1 hover:shadow-md transition-shadow border border-gray-100 mb-1">
                            <CardContent className="p-5">
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <h3 className="font-semibold text-base text-gray-800 leading-snug">
                                  {booking.businessName}
                                </h3>
                                <span
                                  className="flex-shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium"
                                  style={{
                                    backgroundColor: catColor.bg,
                                    color: catColor.text,
                                  }}
                                >
                                  {booking.businessCategory || 'Sin categoría'}
                                </span>
                              </div>

                              <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-gray-500">
                                {/* Fecha */}
                                <span className="flex items-center gap-1.5">
                                  <Calendar className="h-4 w-4 flex-shrink-0" />
                                  {formatDate(booking.bookingDate)}
                                </span>

                                {/* Horario */}
                                {(start || end) && (
                                  <span className="flex items-center gap-1.5">
                                    <Clock className="h-4 w-4 flex-shrink-0" />
                                    {start && end
                                      ? `${start} – ${end}`
                                      : start
                                      ? `Desde ${start}`
                                      : `Hasta ${end}`}
                                  </span>
                                )}

                                {/* Ubicación */}
                                {(booking.businessAddress || booking.businessCity) && (
                                  <span className="flex items-center gap-1.5">
                                    <MapPin className="h-4 w-4 flex-shrink-0" />
                                    {[booking.businessAddress, booking.businessCity]
                                      .filter(Boolean)
                                      .join(', ')}
                                  </span>
                                )}
                              </div>

                              {/* Estado */}
                              <div className="mt-3 flex items-center gap-2">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                    booking.status === 'APPROVED'
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-yellow-100 text-yellow-700'
                                  }`}
                                >
                                  {booking.status === 'APPROVED' ? 'Confirmada' : 'Pendiente'}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {booking.numPeople}{' '}
                                  {booking.numPeople === 1 ? 'persona' : 'personas'} ·{' '}
                                  ${Number(booking.totalPrice).toLocaleString('es-CO')}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}