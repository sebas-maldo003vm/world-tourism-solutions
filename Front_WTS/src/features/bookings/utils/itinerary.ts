import type {
  Booking,
  ItineraryCityGroup,
  ItineraryPeriod,
  TravelDateMark,
} from '@/features/bookings/types';

export function parseBookingDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function startOfLocalDay(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function isPastTravel(booking: Booking, today = startOfLocalDay()): boolean {
  if (String(booking.status || '').toUpperCase() === 'COMPLETED') return true;
  return parseBookingDate(booking.bookingDate) < today;
}

export function flattenItinerary(groups: ItineraryCityGroup[]): Booking[] {
  return groups.flatMap((group) => group.bookings ?? []);
}

export function regroupByCity(bookings: Booking[]): ItineraryCityGroup[] {
  const grouped = new Map<string, Booking[]>();
  for (const booking of bookings) {
    const city = booking.businessCity?.trim() || 'Sin ciudad';
    const current = grouped.get(city) ?? [];
    current.push(booking);
    grouped.set(city, current);
  }
  return [...grouped.entries()].map(([city, cityBookings]) => ({
    city,
    bookings: cityBookings,
  }));
}

export function filterItinerary(
  groups: ItineraryCityGroup[],
  period: ItineraryPeriod,
  today = startOfLocalDay(),
): ItineraryCityGroup[] {
  if (period === 'all') return groups;
  const bookings = flattenItinerary(groups).filter((booking) =>
    period === 'past' ? isPastTravel(booking, today) : !isPastTravel(booking, today),
  );
  return regroupByCity(bookings);
}

export function buildDateMarks(
  groups: ItineraryCityGroup[],
  today = startOfLocalDay(),
): Record<string, TravelDateMark> {
  const flags = new Map<string, { active: boolean; past: boolean }>();

  for (const booking of flattenItinerary(groups)) {
    if (!booking.bookingDate) continue;
    const key = booking.bookingDate.slice(0, 10);
    const current = flags.get(key) ?? { active: false, past: false };
    if (isPastTravel(booking, today)) current.past = true;
    else current.active = true;
    flags.set(key, current);
  }

  const marks: Record<string, TravelDateMark> = {};
  for (const [key, flag] of flags) {
    marks[key] = flag.active && flag.past ? 'mixed' : flag.past ? 'past' : 'active';
  }
  return marks;
}

export function countTravels(groups: ItineraryCityGroup[], today = startOfLocalDay()) {
  const bookings = flattenItinerary(groups);
  const past = bookings.filter((booking) => isPastTravel(booking, today)).length;
  return {
    total: bookings.length,
    past,
    active: bookings.length - past,
  };
}

export function formatItineraryDate(dateStr: string): string {
  return parseBookingDate(dateStr).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function formatClock(time: string | null | undefined): string | null {
  if (!time) return null;
  return time.slice(0, 5);
}
