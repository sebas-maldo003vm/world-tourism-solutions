import { api } from '@/core/api/client';
import type { Filters } from '@/shared/components/catalog/catalogFilters';

export type ProposalStatus = 'PROPOSED' | 'ACCEPTED' | 'CANCELLED';

export interface ItineraryProposalItem {
  id: number;
  sortOrder: number;
  providerProfileId: number;
  businessName: string;
  category: string;
  city?: string | null;
  description?: string | null;
  price?: number | null;
  avgRating?: number | null;
  logoUrl?: string | null;
}

export interface ItineraryProposal {
  id: number;
  title: string;
  date: string;
  status: ProposalStatus;
  createdAt?: string;
  items: ItineraryProposalItem[];
}

export interface ProposalFilterPayload {
  search: string | null;
  categories: string[];
  location: string;
  radiusKm: number | null;
  originLatitude: number | null;
  originLongitude: number | null;
  priceMin: number | null;
  priceMax: number | null;
  minRating: number | null;
}

export function toProposalFilters(filters: Filters): ProposalFilterPayload {
  const origin = filters.radiusKm != null ? filters.origin : null;
  return {
    search: filters.search.trim() || null,
    categories: filters.categories,
    location: filters.location,
    radiusKm: origin ? filters.radiusKm : null,
    originLatitude: origin?.lat ?? null,
    originLongitude: origin?.lng ?? null,
    priceMin: filters.priceMin,
    priceMax: filters.priceMax,
    minRating: filters.minRating,
  };
}

export const itineraryProposalsApi = {
  generate: (date: string, filters: Filters) =>
    api.post<ItineraryProposal>('/itineraries/proposals', {
      date,
      filters: toProposalFilters(filters),
    }),

  list: (date?: string) =>
    api.get<ItineraryProposal[]>('/itineraries/proposals', {
      params: date ? { date } : undefined,
    }),

  accept: (proposalId: number) =>
    api.post<ItineraryProposal>(`/itineraries/proposals/${proposalId}/accept`),

  cancel: (proposalId: number) =>
    api.post<ItineraryProposal>(`/itineraries/proposals/${proposalId}/cancel`),
};
