import { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '../components/ui/tabs';

import { mockServices } from '../Services/mockData';

import {
  User,
  Bookmark,
  Calendar,
  Settings
} from 'lucide-react';

import { Badge } from '../components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { api } from '../Services/api';

interface UserData {
  id: number;
  name: string;
  email: string;
  role: 'USER' | 'PROVIDER' | 'ADMIN';
}

interface BookingData {
  id: number | string;
  businessId?: number | string;
  serviceId?: number | string;
  business_id?: number | string;
  service_id?: number | string;
  businessName?: string;
  serviceName?: string;
  bookingDate?: string;
  date?: string;
  numPeople?: number;
  people?: number;
  totalPrice?: number;
  total?: number;
  status?: string;
  business?: {
    id?: number | string;
    businessId?: number | string;
    serviceId?: number | string;
    businessName?: string;
    title?: string;
    price?: number;
  };
  service?: {
    id?: number | string;
    businessId?: number | string;
    serviceId?: number | string;
    businessName?: string;
    title?: string;
    name?: string;
    price?: number;
  };
}

const getBookingBusinessId = (booking: BookingData) => (
  booking.businessId ||
  booking.serviceId ||
  booking.business_id ||
  booking.service_id ||
  booking.business?.id ||
  booking.business?.businessId ||
  booking.business?.serviceId ||
  booking.service?.id ||
  booking.service?.businessId ||
  booking.service?.serviceId
);

const getBookingName = (booking: BookingData) => (
  booking.businessName ||
  booking.serviceName ||
  booking.business?.businessName ||
  booking.business?.title ||
  booking.service?.businessName ||
  booking.service?.title ||
  booking.service?.name ||
  'Servicio'
);

const getBookingDate = (booking: BookingData) => (
  booking.bookingDate || booking.date || 'Sin fecha'
);

const getBookingPeople = (booking: BookingData) => (
  booking.numPeople ?? booking.people ?? 1
);

const getBookingTotal = (booking: BookingData) => {
  if (booking.totalPrice != null) {
    return booking.totalPrice;
  }

  if (booking.total != null) {
    return booking.total;
  }

  return Number(booking.business?.price || booking.service?.price || 0) *
    getBookingPeople(booking);
};

const getStatusVariant = (status?: string) => {
  const normalizedStatus = status?.toLowerCase();

  if (normalizedStatus === 'approved' || normalizedStatus === 'active') {
    return 'default';
  }

  if (normalizedStatus === 'pending') {
    return 'secondary';
  }

  return 'destructive';
};

export function Profile() {

  const navigate = useNavigate();

  const savedServices = mockServices.slice(0, 3);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  // USER
  const storedUser = localStorage.getItem('user');

  const user: UserData | null =
    storedUser ? JSON.parse(storedUser) : null;

  // ROLES
  const isTurista = user?.role === 'USER';

  const isProvider = user?.role === 'PROVIDER';

  useEffect(() => {
    if (!isTurista) {
      return;
    }

    const loadBookings = async () => {
      try {
        setBookingsLoading(true);

        const response = await api.get('/bookings');

        setBookings(
          Array.isArray(response.data)
            ? response.data
            : [response.data]
        );
      } catch (error: any) {
        console.error(error);

        alert(
          error?.response?.data?.message ||
          'Error cargando reservas'
        );
      } finally {
        setBookingsLoading(false);
      }
    };

    loadBookings();
  }, [isTurista]);

  return (
    <div className="min-h-screen bg-gray-50 py-6">

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* PROFILE HEADER */}
        <Card className="mb-6">

          <CardContent className="p-6">

            <div className="flex items-start gap-6">

              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">

                <User className="h-12 w-12 text-white" />

              </div>

              <div className="flex-1">

                <h1 className="text-3xl font-bold mb-2">
                  {user?.name}
                </h1>

                <p className="text-gray-600 mb-4">
                  {user?.email}
                </p>

                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => navigate('/edit-profile')}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Editar perfil
                </Button>

              </div>

            </div>

          </CardContent>

        </Card>

        {/* ================= USER ================= */}
        {isTurista && (

          <Tabs defaultValue="bookings" className="space-y-6">

            <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">

              <TabsTrigger value="bookings" className="gap-2">
                <Calendar className="h-4 w-4" />
                Mis Reservas
              </TabsTrigger>

              <TabsTrigger value="saved" className="gap-2">
                <Bookmark className="h-4 w-4" />
                Guardados
              </TabsTrigger>

            </TabsList>

            {/* BOOKINGS */}
            <TabsContent value="bookings">

              <div className="space-y-4">

                <h2 className="text-xl font-semibold">
                  Historial de reservas
                </h2>

                {bookingsLoading ? (
                  <Card>
                    <CardContent className="p-6 text-center text-gray-600">
                      Cargando reservas...
                    </CardContent>
                  </Card>
                ) : bookings.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center text-gray-600">
                      Aun no tienes reservas.
                    </CardContent>
                  </Card>
                ) : bookings.map((booking) => (

                  <Card key={booking.id}>

                    <CardContent className="p-6">

                      <div className="flex items-start justify-between">

                        <div className="flex-1">

                          <div className="flex items-center gap-3 mb-2">

                            <h3 className="font-semibold text-lg">
                              {getBookingName(booking)}
                            </h3>

                            <Badge
                              variant={
                                getStatusVariant(booking.status)
                              }
                            >
                              {booking.status || 'Sin estado'}
                            </Badge>

                          </div>

                          <div className="space-y-1 text-sm text-gray-600">

                            <p>Fecha: {getBookingDate(booking)}</p>

                            <p>Personas: {getBookingPeople(booking)}</p>

                            <p className="font-semibold text-gray-900">
                              Total: ${getBookingTotal(booking).toLocaleString()}
                            </p>

                          </div>

                        </div>

                        <div className="flex gap-2">

                          {getBookingBusinessId(booking) ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                navigate(
                                  `/reviews/${getBookingBusinessId(booking)}`,
                                  {
                                    state: {
                                      serviceName: getBookingName(booking),
                                    },
                                  }
                                )
                              }
                              className="rounded-full"
                            >
                              Dejar reseña
                            </Button>
                          ) : null}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/chat')}
                            className="rounded-full"
                          >
                            Contactar
                          </Button>

                        </div>

                      </div>

                    </CardContent>

                  </Card>
                ))}

              </div>

            </TabsContent>

            {/* SAVED */}
            <TabsContent value="saved">

              <div className="space-y-4">

                <h2 className="text-xl font-semibold">
                  Servicios guardados
                </h2>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">

                  {savedServices.map((service) => (

                    <Card
                      key={service.id}
                      className="overflow-hidden hover:shadow-lg transition-shadow"
                    >

                      <img
                        src={service.image}
                        alt={service.name}
                        className="w-full h-48 object-cover"
                      />

                      <CardContent className="p-4">

                        <h3 className="font-semibold mb-2">
                          {service.name}
                        </h3>

                        <p className="text-sm text-gray-600 mb-3">
                          {service.location}
                        </p>

                        <div className="flex items-center justify-between">

                          <span className="font-bold text-blue-600">
                            ${service.price}
                          </span>

                          <Button
                            size="sm"
                            onClick={() =>
                              navigate(`/booking/${service.id}`)
                            }
                            className="bg-blue-600 hover:bg-blue-700 rounded-full"
                          >
                            Ver más
                          </Button>

                        </div>

                      </CardContent>

                    </Card>
                  ))}

                </div>

              </div>

            </TabsContent>

          </Tabs>
        )}

        {/* ================= PROVIDER ================= */}
        {isProvider && (

          <Tabs defaultValue="reviews">

            <TabsList>

              <TabsTrigger value="reviews">
                Mis reseñas
              </TabsTrigger>

            </TabsList>

            <TabsContent value="reviews">

              <Card>

                <CardContent className="p-10 text-center">

                  <h2 className="text-xl font-semibold mb-2">
                    Aún no tienes reseñas
                  </h2>

                  <p className="text-gray-600">
                    Cuando tengas reseñas aparecerán aquí.
                  </p>

                </CardContent>

              </Card>

            </TabsContent>

          </Tabs>
        )}

      </div>

    </div>
  );
}
