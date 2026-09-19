import { useEffect, useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/shared/components/ui/tabs';

import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, API_ORIGIN } from '@/core/api/client';
import { useAuth } from '@/features/auth/context/AuthContext';
import { UserAvatar } from '@/shared/components/UserAvatar';
import { contactProvider } from '@/features/chat/utils/contactProvider';
import { useFavorites } from '@/features/catalog/hooks/useFavorites';
import {
  User,
  Bookmark,
  Calendar,
  Settings
} from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';

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
  providerUserId?: number;
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

const PROFILE_TABS = ['account', 'bookings', 'saved'] as const;
type ProfileTab = (typeof PROFILE_TABS)[number];

function resolveProfileTab(tab: string | null): ProfileTab {
  if (tab === 'bookings' || tab === 'saved') {
    return tab;
  }

  return 'account';
}

export function Profile() {

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = resolveProfileTab(searchParams.get('tab'));
  const { favorites, loading: favoritesLoading } = useFavorites();
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  const { user } = useAuth();

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

  const handleTabChange = (value: string) => {
    const next = new URLSearchParams(searchParams);

    if (value === 'bookings' || value === 'saved') {
      next.set('tab', value);
    } else {
      next.delete('tab');
    }

    setSearchParams(next);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* PROFILE HEADER */}
        <Card className="mb-6">

          <CardContent className="p-6">

            <div className="flex items-start gap-6">

              <UserAvatar src={user?.profilePictureUrl} name={user?.name} size="xl" />

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

          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="space-y-6"
          >

            <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">

              <TabsTrigger value="account" className="gap-2">
                <User className="h-4 w-4" />
                Mis datos
              </TabsTrigger>

              <TabsTrigger value="bookings" className="gap-2">
                <Calendar className="h-4 w-4" />
                Mis Reservas
              </TabsTrigger>

              <TabsTrigger value="saved" className="gap-2">
                <Bookmark className="h-4 w-4" />
                Guardados
              </TabsTrigger>

            </TabsList>

            <TabsContent value="account">

              <div className="space-y-4">

                <h2 className="text-xl font-semibold">
                  Información personal
                </h2>

                <Card>
                  <CardContent className="p-6 space-y-3 text-sm text-gray-600">
                    <p>
                      <span className="font-medium text-gray-900">Nombre: </span>
                      {user?.name}
                    </p>
                    <p>
                      <span className="font-medium text-gray-900">Correo: </span>
                      {user?.email}
                    </p>
                  </CardContent>
                </Card>

              </div>

            </TabsContent>

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
                            onClick={() => {
                              const businessId = Number(
                                getBookingBusinessId(booking)
                              );
                              const serviceName = getBookingName(booking);
                              if (businessId) {
                                contactProvider(navigate, businessId, {
                                  serviceId: businessId,
                                  serviceName,
                                  providerName: serviceName,
                                });
                              } else {
                                navigate('/messages');
                              }
                            }}
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

                {favoritesLoading ? (
                  <Card>
                    <CardContent className="p-6 text-center text-gray-600">
                      Cargando favoritos...
                    </CardContent>
                  </Card>
                ) : favorites.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center text-gray-600">
                      Aún no tienes sitios guardados en favoritos.
                    </CardContent>
                  </Card>
                ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">

                  {favorites.map((favorite) => {
                    const service = favorite.business;
                    const image =
                      service.imageUrls?.[0] ||
                      service.logoUrl ||
                      '';
                    const imageUrl = image.startsWith('http')
                      ? image
                      : image
                      ? `${API_ORIGIN}${image}`
                      : 'https://via.placeholder.com/400';

                    return (
                    <Card
                      key={favorite.id}
                      className="overflow-hidden hover:shadow-lg transition-shadow"
                    >

                      <img
                        src={imageUrl}
                        alt={service.businessName}
                        className="w-full h-48 object-cover"
                      />

                      <CardContent className="p-4">

                        <h3 className="font-semibold mb-2">
                          {service.businessName}
                        </h3>

                        <p className="text-sm text-gray-600 mb-3">
                          {service.city || service.address || 'Sin ubicación'}
                        </p>

                        <div className="flex items-center justify-between">

                          <span className="font-bold text-blue-600">
                            ${service.price || 0}
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
                  )})}

                </div>
                )}

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
