import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { bookingsApi } from '@/features/bookings/services/bookingsApi';
import type { ItineraryCityGroup, ItineraryPeriod } from '@/features/bookings/types';
import {
  buildDateMarks,
  countTravels,
  filterItinerary,
  toIsoDate,
} from '@/features/bookings/utils/itinerary';

function readError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const message = (err.response?.data as { message?: unknown } | undefined)?.message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
}

function asGroups(data: unknown): ItineraryCityGroup[] {
  return Array.isArray(data) ? (data as ItineraryCityGroup[]) : [];
}

export function useItineraryCalendar() {
  const [schedule, setSchedule] = useState<ItineraryCityGroup[]>([]);
  const [dayGroups, setDayGroups] = useState<ItineraryCityGroup[] | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [period, setPeriod] = useState<ItineraryPeriod>('all');
  const [loading, setLoading] = useState(true);
  const [dayLoading, setDayLoading] = useState(false);
  const [error, setError] = useState('');
  const [dayError, setDayError] = useState('');
  const requestId = useRef(0);

  const loadSchedule = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await bookingsApi.getItinerary();
      setSchedule(asGroups(response.data));
    } catch (err) {
      setError(readError(err, 'No se pudo cargar el itinerario. Intenta de nuevo.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSchedule();
  }, [loadSchedule]);

  const selectDate = useCallback(async (date: Date | undefined) => {
    const current = ++requestId.current;
    setSelectedDate(date);
    setDayError('');

    if (!date) {
      setDayGroups(null);
      setDayLoading(false);
      return;
    }

    setDayLoading(true);
    try {
      const response = await bookingsApi.getItinerary(toIsoDate(date));
      if (current !== requestId.current) return;
      setDayGroups(asGroups(response.data));
    } catch (err) {
      if (current !== requestId.current) return;
      setDayGroups([]);
      setDayError(readError(err, 'No se pudo consultar el itinerario de esa fecha.'));
    } finally {
      if (current === requestId.current) setDayLoading(false);
    }
  }, []);

  const changePeriod = useCallback((next: ItineraryPeriod) => {
    requestId.current += 1;
    setPeriod(next);
    setSelectedDate(undefined);
    setDayGroups(null);
    setDayLoading(false);
    setDayError('');
  }, []);

  const clearDate = useCallback(() => {
    void selectDate(undefined);
  }, [selectDate]);

  const dateMarks = useMemo(() => buildDateMarks(schedule), [schedule]);
  const counts = useMemo(() => countTravels(schedule), [schedule]);
  const visibleGroups = useMemo(
    () => (selectedDate && dayGroups ? dayGroups : filterItinerary(schedule, period)),
    [selectedDate, dayGroups, schedule, period],
  );

  return {
    schedule,
    visibleGroups,
    selectedDate,
    period,
    loading,
    dayLoading,
    error,
    dayError,
    dateMarks,
    counts,
    loadSchedule,
    selectDate,
    changePeriod,
    clearDate,
  };
}
