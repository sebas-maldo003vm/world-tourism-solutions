import { useEffect, useState } from 'react';

import { Button } from '@/shared/components/ui/button';

import {
  Card,
  CardContent,
} from '@/shared/components/ui/card';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/components/ui/tabs';

import { useNavigate } from 'react-router-dom';

import {
  CalendarDays,
  Check,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';

import { api } from '@/core/api/client';
import { ImageCarousel } from '@/shared/components/catalog/ImageCarousel';

interface Service {
  id: number;
  businessId?: number;
  businessName?: string;
  title?: string;
  description?: string;
  category?: string;
  price?: number;
  city?: string;
  location?: string;
  imageUrl?: string;
  imageUrls?: string[];
  images?: string[];
  status?: string;
}

interface ProviderBooking {
  id: number | string;
  bookingId?: number | string;
  businessId?: number | string;
  serviceId?: number | string;
  businessName?: string;
  serviceName?: string;
  bookingDate?: string;
  date?: string;
  numPeople?: number;
  people?: number;
  totalPrice?: number;
  total?: number;
  status?: string;
  userName?: string;
  userEmail?: string;
  user?: {
    name?: string;
    email?: string;
  };
  business?: {
    businessName?: string;
    title?: string;
    price?: number;
  };
}

const getBusinessId = (service: Service) => (
  service.businessId ?? service.id
);

const getServiceStatus = (service: Service) => (
  service.status?.toUpperCase() || ''
);

const isActiveService = (service: Service) => {
  const status = getServiceStatus(service);

  return status === 'ACTIVE' || status === 'APPROVED' || status === 'APROVED';
};

const isPendingService = (service: Service) => (
  getServiceStatus(service) === 'PENDING'
);

const getBookingId = (booking: ProviderBooking) => (
  booking.bookingId ?? booking.id
);

const getBookingName = (booking: ProviderBooking) => (
  booking.businessName ||
  booking.serviceName ||
  booking.business?.businessName ||
  booking.business?.title ||
  'Servicio'
);

const getBookingDate = (booking: ProviderBooking) => (
  booking.bookingDate || booking.date || 'Sin fecha'
);

const getBookingPeople = (booking: ProviderBooking) => (
  booking.numPeople ?? booking.people ?? 1
);

const getBookingTotal = (booking: ProviderBooking) => {
  if (booking.totalPrice != null) {
    return booking.totalPrice;
  }

  if (booking.total != null) {
    return booking.total;
  }

  return Number(booking.business?.price || 0) * getBookingPeople(booking);
};

const getBookingStatus = (booking: ProviderBooking) => (
  booking.status || 'PENDING'
);

const isPendingBooking = (booking: ProviderBooking) => (
  getBookingStatus(booking).toUpperCase() === 'PENDING'
);

const getStatusClassName = (status: string) => {
  const normalizedStatus = status.toUpperCase();

  if (normalizedStatus === 'APPROVED' || normalizedStatus === 'APROVED') {
    return 'bg-green-100 text-green-700';
  }

  if (normalizedStatus === 'PENDING') {
    return 'bg-yellow-100 text-yellow-700';
  }

  return 'bg-red-100 text-red-700';
};

export function AccesorDashboard() {

  const navigate = useNavigate();

  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<ProviderBooking[]>([]);

  const [loading, setLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [updatingBookingId, setUpdatingBookingId] =
    useState<number | string | null>(null);

  useEffect(() => {
    loadServices();
    loadBookings();
  }, []);

  const loadServices = async () => {

    try {

      const response = await api.get(
        '/provider/business'
      );

      setServices(
        Array.isArray(response.data)
          ? response.data
          : [response.data]
      );

    } catch (error) {

      console.error(error);

      alert('Error cargando servicios');

    } finally {

      setLoading(false);
    }
  };

  const loadBookings = async () => {

    try {

      setBookingsLoading(true);

      const response = await api.get(
        '/provider/bookings'
      );

      setBookings(
        Array.isArray(response.data)
          ? response.data
          : [response.data]
      );

    } catch (error) {

      console.error(error);

      alert('Error cargando reservas');

    } finally {

      setBookingsLoading(false);
    }
  };

  const handleBookingAction = async (
    booking: ProviderBooking,
    action: 'approve' | 'reject'
  ) => {
    const bookingId = getBookingId(booking);

    try {
      setUpdatingBookingId(bookingId);

      await api.post(
        `/provider/bookings/${bookingId}/${action}`
      );

      setBookings((currentBookings) =>
        currentBookings.map((currentBooking) => (
          getBookingId(currentBooking) === bookingId
            ? {
                ...currentBooking,
                status: action === 'approve' ? 'APPROVED' : 'REJECTED',
              }
            : currentBooking
        ))
      );

      alert(
        action === 'approve'
          ? 'Reserva aprobada correctamente'
          : 'Reserva rechazada correctamente'
      );
    } catch (error: any) {
      console.error(error);

      alert(
        error?.response?.data?.message ||
        'Error actualizando reserva'
      );
    } finally {
      setUpdatingBookingId(null);
    }
  };

  const handleDelete = async (service: Service) => {
    const serviceName = service.businessName || service.title || 'este servicio';
    const shouldDelete = window.confirm(
      `¿Seguro que quieres eliminar ${serviceName}?`
    );

    if (!shouldDelete) {
      return;
    }

    try {
      await api.delete(`/provider/business/${getBusinessId(service)}`);

      setServices((currentServices) =>
        currentServices.filter((currentService) => (
          currentService.id !== service.id
        ))
      );

      alert('Servicio eliminado correctamente');
    } catch (error: any) {
      console.error(error);

      alert(
        error?.response?.data?.message ||
        'Error eliminando servicio'
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">

      <div className="max-w-7xl mx-auto px-4">

        {/* HEADER */}
        <div className="mb-6 flex justify-between items-center">

          <div>
            <h1 className="text-3xl font-bold">
              Panel de Prestador
            </h1>

            <p className="text-gray-600">
              Gestiona tus servicios
            </p>
          </div>

          <Button
            onClick={() =>
              navigate('/create-service')
            }
            className="bg-blue-600 hover:bg-blue-700 rounded-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Publicar servicio
          </Button>

        </div>

        {/* STATS */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">

          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600">
                Total servicios
              </p>

              <p className="text-3xl font-bold">
                {services.length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600">
                Reservas Pendientes
              </p>

              <p className="text-3xl font-bold">
                {
                  services.filter(
                    isActiveService
                  ).length
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600">
                Total Reservas
              </p>

              <p className="text-3xl font-bold">
                {
                  services.filter(
                    isPendingService
                  ).length
                }
              </p>
            </CardContent>
          </Card>

        </div>

        <Tabs defaultValue="services">

          <TabsList>
            <TabsTrigger value="services">
              Mis servicios
            </TabsTrigger>

            <TabsTrigger value="bookings" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              Reservas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="services">

            {loading ? (

              <p>Cargando...</p>

            ) : (

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">

                {services.map((service) => (

                  <Card
                    key={service.id}
                    className="overflow-hidden"
                  >

                    <ImageCarousel
                      images={
                        service.imageUrls?.length
                          ? service.imageUrls
                          : service.images?.length
                          ? service.images
                          : [service.imageUrl]
                      }
                      alt={service.businessName || service.title || 'Servicio'}
                      className="h-48 w-full"
                    />

                    <CardContent className="p-4">

                      <h3 className="font-semibold text-lg">
                        {service.businessName || service.title}
                      </h3>

                      <p className="text-sm text-gray-600">
                        {[service.city, service.location].filter(Boolean).join(', ') ||
                          'Sin ubicación'}
                      </p>

                      <p className="text-lg font-bold text-blue-600 mt-2">
                        ${service.price || 0}
                      </p>

                      <div className="mt-3 flex gap-2">

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            navigate(
                              `/edit-service/${getBusinessId(service)}`,
                              { state: { service } }
                            )
                          }
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Editar
                        </Button>

                        <Button
                          size="sm"
                          onClick={() =>
                            navigate(
                              `/booking/${service.id}`
                            )
                          }
                        >
                          Ver
                        </Button>

                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => handleDelete(service)}
                          className="h-9 w-9 text-red-600 hover:text-red-700"
                          aria-label="Eliminar servicio"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>

                      </div>

                    </CardContent>

                  </Card>
                ))}

              </div>
            )}

          </TabsContent>

          <TabsContent value="bookings">

            <div className="mt-4">

              {bookingsLoading ? (

                <Card>
                  <CardContent className="p-6 text-center text-gray-600">
                    Cargando reservas...
                  </CardContent>
                </Card>

              ) : bookings.length === 0 ? (

                <Card>
                  <CardContent className="p-6 text-center text-gray-600">
                    No hay reservas registradas.
                  </CardContent>
                </Card>

              ) : (

                <div className="overflow-x-auto rounded-lg border bg-white">
                  <table className="w-full text-sm">

                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-3 text-left">
                          Servicio
                        </th>
                        <th className="p-3 text-left">
                          Cliente
                        </th>
                        <th className="p-3">
                          Correo
                        </th>
                        <th className="p-3">
                          Fecha
                        </th>
                        <th className="p-3">
                          Personas
                        </th>
                        <th className="p-3">
                          Total
                        </th>
                        <th className="p-3">
                          Estado
                        </th>
                        <th className="p-3 text-right">
                          Acciones
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {bookings.map((booking) => {
                        const bookingId = getBookingId(booking);
                        const status = getBookingStatus(booking);
                        const isUpdating = updatingBookingId === bookingId;

                        return (
                          <tr
                            key={bookingId}
                            className="border-t hover:bg-gray-50"
                          >
                            <td className="p-3 font-medium">
                              {getBookingName(booking)}
                            </td>

                            <td className="p-3">
                              {booking.userName || booking.user?.name || 'Cliente'}
                            </td>

                            <td className="p-3 text-center">
                              {booking.userEmail || booking.user?.email || 'Sin correo'}
                            </td>

                            <td className="p-3 text-center">
                              {getBookingDate(booking)}
                            </td>

                            <td className="p-3 text-center">
                              {getBookingPeople(booking)}
                            </td>

                            <td className="p-3 text-center">
                              ${getBookingTotal(booking).toLocaleString()}
                            </td>

                            <td className="p-3 text-center">
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${getStatusClassName(status)}`}
                              >
                                {status}
                              </span>
                            </td>

                            <td className="p-3">
                              <div className="flex justify-end gap-2">
                                {isPendingBooking(booking) ? (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        handleBookingAction(booking, 'approve')
                                      }
                                      disabled={isUpdating}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <Check className="h-4 w-4 mr-1" />
                                      Aprobar
                                    </Button>

                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() =>
                                        handleBookingAction(booking, 'reject')
                                      }
                                      disabled={isUpdating}
                                    >
                                      <X className="h-4 w-4 mr-1" />
                                      Rechazar
                                    </Button>
                                  </>
                                ) : (
                                  <span className="text-sm text-gray-500">
                                    Sin acciones
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>

                  </table>
                </div>
              )}

            </div>

          </TabsContent>

        </Tabs>

      </div>

    </div>
  );
}
