/** Contrato alineado con BookingResponse del backend. */
export type BookingStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'COMPLETED'
  | string;

export interface Booking {
  id: number;
  bookingDate: string;
  startTime?: string | null;
  endTime?: string | null;
  numPeople: number;
  totalPrice: number;
  status: BookingStatus;
  createdAt?: string;
  businessId: number;
  businessName: string;
  businessPrice?: number;
  businessCity?: string;
  businessAddress?: string;
  businessCategory?: string;
  providerUserId?: number | null;
  userId?: number | null;
  userName?: string | null;
  userEmail?: string | null;
}

export type BookingAction = 'approve' | 'reject';

/** Respuesta de GET /api/bookings/itinerary. */
export interface ItineraryCityGroup {
  city: string;
  bookings: Booking[];
}

export type ItineraryPeriod = 'all' | 'active' | 'past';

export type TravelDateMark = 'active' | 'past' | 'mixed';
