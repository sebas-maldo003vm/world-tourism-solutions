import type { Booking } from '@/features/bookings/types';

export function normalizeBookings(data: unknown): Booking[] {
  if (Array.isArray(data)) {
    return data as Booking[];
  }
  if (data && typeof data === 'object') {
    return [data as Booking];
  }
  return [];
}

export function getBookingServiceName(booking: Booking): string {
  return booking.businessName || 'Servicio';
}

export function isPendingBooking(booking: Booking): boolean {
  return String(booking.status || '').toUpperCase() === 'PENDING';
}

export function getStatusBadgeClass(status?: string): string {
  const normalized = String(status || '').toUpperCase();

  if (normalized === 'APPROVED' || normalized === 'COMPLETED') {
    return 'bg-green-100 text-green-700';
  }

  if (normalized === 'PENDING') {
    return 'bg-yellow-100 text-yellow-700';
  }

  return 'bg-red-100 text-red-700';
}

export function formatBookingStatus(status?: string): string {
  return String(status || 'PENDING').toLowerCase();
}
