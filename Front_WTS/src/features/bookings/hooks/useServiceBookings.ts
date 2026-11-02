import { useCallback, useEffect, useState } from 'react';
import { bookingsApi } from '@/features/bookings/services/bookingsApi';
import type { Booking, BookingAction } from '@/features/bookings/types';
import {
  normalizeBookings,
} from '@/features/bookings/utils/bookingHelpers';

interface UseServiceBookingsResult {
  bookings: Booking[];
  loading: boolean;
  error: string;
  updatingId: number | null;
  reload: () => Promise<void>;
  updateStatus: (bookingId: number, action: BookingAction) => Promise<void>;
}

/**
 * Carga las reservas del proveedor y las filtra por businessId (param de ruta).
 * Usa GET /api/provider/bookings — el listado del turista es GET /api/bookings.
 */
export function useServiceBookings(
  businessId: string | undefined
): UseServiceBookingsResult {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const reload = useCallback(async () => {
    if (!businessId) {
      setBookings([]);
      setLoading(false);
      setError('Servicio no especificado');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await bookingsApi.listProvider();
      const all = normalizeBookings(response.data);
      const filtered = all.filter(
        (booking) => String(booking.businessId) === String(businessId)
      );

      setBookings(filtered);
    } catch (err: unknown) {
      console.error(err);
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Error cargando reservas';
      setError(message);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const updateStatus = async (bookingId: number, action: BookingAction) => {
    try {
      setUpdatingId(bookingId);
      const response = await bookingsApi.updateStatus(bookingId, action);
      const updated = response.data;

      setBookings((current) =>
        current.map((booking) =>
          booking.id === bookingId
            ? { ...booking, ...updated, status: updated.status }
            : booking
        )
      );
    } catch (err: unknown) {
      console.error(err);
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Error actualizando reserva';
      alert(message);
    } finally {
      setUpdatingId(null);
    }
  };

  return {
    bookings,
    loading,
    error,
    updatingId,
    reload,
    updateStatus,
  };
}
