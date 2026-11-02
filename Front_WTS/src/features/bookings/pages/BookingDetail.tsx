import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { contactClient } from '@/features/chat/utils/contactClient';
import { useServiceBookings } from '@/features/bookings/hooks/useServiceBookings';
import {
  formatBookingStatus,
  getBookingServiceName,
  getStatusBadgeClass,
  isPendingBooking,
} from '@/features/bookings/utils/bookingHelpers';
import type { Booking } from '@/features/bookings/types';

export function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { bookings, loading, error, updatingId, reload, updateStatus } =
    useServiceBookings(id);
  const [contactingId, setContactingId] = useState<number | null>(null);

  const serviceName =
    bookings.length > 0 ? getBookingServiceName(bookings[0]) : null;

  const handleContact = async (booking: Booking) => {
    if (booking.userId == null) {
      alert('No se puede contactar: la reserva no incluye el id del cliente.');
      return;
    }

    try {
      setContactingId(booking.id);
      await contactClient(navigate, booking.userId, booking.businessId);
    } finally {
      setContactingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg font-medium text-gray-600">
        Cargando reservas...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-gray-600">
        <p>{error}</p>
        <Button onClick={() => void reload()} variant="outline">
          Reintentar
        </Button>
        <Button variant="ghost" onClick={() => navigate(-1)}>
          ← Volver
        </Button>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="max-w-5xl mx-auto px-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            ← Volver
          </Button>
          <p className="text-center py-10 text-gray-600">
            No hay reservas para este servicio
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-5xl mx-auto px-4">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          ← Volver
        </Button>

        <h1 className="text-3xl font-bold mb-6">
          Reservas de {serviceName}
        </h1>

        <div className="border rounded-lg overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Cliente</th>
                <th className="p-3">Correo</th>
                <th className="p-3">Fecha</th>
                <th className="p-3">Personas</th>
                <th className="p-3">Total</th>
                <th className="p-3">Estado</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {bookings.map((booking) => {
                const isUpdating = updatingId === booking.id;
                const isContacting = contactingId === booking.id;

                return (
                  <tr key={booking.id} className="border-t hover:bg-gray-50">
                    <td className="p-3">{booking.userName || '—'}</td>
                    <td className="p-3 text-center">
                      {booking.userEmail || '—'}
                    </td>
                    <td className="p-3 text-center">{booking.bookingDate}</td>
                    <td className="p-3 text-center">{booking.numPeople}</td>
                    <td className="p-3 text-center">
                      ${Number(booking.totalPrice).toLocaleString()}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(booking.status)}`}
                      >
                        {formatBookingStatus(booking.status)}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isContacting}
                          onClick={() => void handleContact(booking)}
                        >
                          {isContacting ? 'Abriendo...' : 'Contactar'}
                        </Button>

                        {isPendingBooking(booking) && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              disabled={isUpdating}
                              onClick={() =>
                                void updateStatus(booking.id, 'approve')
                              }
                            >
                              {isUpdating ? '...' : 'Aceptar'}
                            </Button>

                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={isUpdating}
                              onClick={() =>
                                void updateStatus(booking.id, 'reject')
                              }
                            >
                              {isUpdating ? '...' : 'Rechazar'}
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
