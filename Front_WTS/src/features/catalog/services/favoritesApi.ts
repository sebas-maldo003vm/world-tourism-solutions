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

export const favoritesApi = {
  list: () => api.get<FavoriteItem[]>('/favorites'),

  add: (businessId: number) =>
    api.post<FavoriteItem>(`/favorites/${businessId}`),

  remove: (businessId: number) =>
    api.delete(`/favorites/${businessId}`),

  status: (businessId: number) =>
    api.get<FavoriteStatus>(`/favorites/${businessId}/status`),
};
