import { api } from '@/core/api/client';
import type { Booking, BookingAction, ItineraryCityGroup } from '@/features/bookings/types';

export const bookingsApi = {
  /** Reservas del usuario autenticado (turista). */
  listMine: () => api.get<Booking[]>('/bookings'),

  /**
   * Itinerario agrupado por ciudad.
   * Sin fecha: activas y completadas. Con `date` (yyyy-MM-dd): solo ese día, incluido el historial.
   */
  getItinerary: (date?: string) =>
    api.get<ItineraryCityGroup[]>('/bookings/itinerary', {
      params: date ? { date } : undefined,
    }),

  /** Reservas hechas a los negocios del proveedor autenticado. */
  listProvider: () => api.get<Booking[]>('/provider/bookings'),

  approve: (bookingId: number) =>
    api.post<Booking>(`/provider/bookings/${bookingId}/approve`),

  reject: (bookingId: number) =>
    api.post<Booking>(`/provider/bookings/${bookingId}/reject`),

  updateStatus: (bookingId: number, action: BookingAction) =>
    action === 'approve'
      ? bookingsApi.approve(bookingId)
      : bookingsApi.reject(bookingId),
};
