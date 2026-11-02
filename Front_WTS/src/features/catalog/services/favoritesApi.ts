import { api } from '@/core/api/client';

export interface FavoriteBusiness {
  id: number;
  businessName: string;
  taxId?: string;
  description?: string;
  address?: string;
  city?: string;
  category?: string;
  price?: string | number;
  avgRating?: number;
  totalReviews?: number;
  website?: string;
  logoUrl?: string;
  imageUrls?: string[];
}

export interface FavoriteItem {
  id: number;
  savedAt: string;
  business: FavoriteBusiness;
}

export interface FavoriteStatus {
  businessId: number;
  favorite: boolean;
}

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const favoritesApi = {
  list: () =>
    api.get<FavoriteItem[]>('/favorites', { headers: authHeaders() }),

  add: (providerProfileId: number) =>
    api.post<FavoriteItem>(`/favorites/${providerProfileId}`, null, {
      headers: authHeaders(),
    }),

  remove: (providerProfileId: number) =>
    api.delete(`/favorites/${providerProfileId}`, { headers: authHeaders() }),

  status: (providerProfileId: number) =>
    api.get<FavoriteStatus>(`/favorites/${providerProfileId}/status`, {
      headers: authHeaders(),
    }),
};
