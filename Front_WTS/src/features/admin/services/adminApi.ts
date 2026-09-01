import { api } from '@/core/api/client';

export type UserRole = 'ADMIN' | 'USER' | 'PROVIDER';

export type ServiceStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'INACTIVE';

export interface AdminStats {
  totalUsers: number;
  totalServices: number;
  pendingServices: number;
  totalBusinesses: number;
  pendingBusinesses: number;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminTourService {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  location?: string;
  imageUrl?: string;
  avgRating: number;
  totalReviews: number;
  status: ServiceStatus;
  createdAt: string;
  providerId: number;
  providerBusinessName: string;
}

export interface AdminBusiness {
  id: number;
  businessName: string;
  taxId?: string;
  description?: string;
  address?: string;
  city?: string;
  category?: string;
  price?: string;
  avgRating?: number;
  totalReviews?: number;
  website?: string;
  logoUrl?: string;
  imageUrls?: string[];
  status: ServiceStatus;
  providerName: string;
  providerEmail: string;
}

export interface AdminUserUpdatePayload {
  name?: string;
  phoneNumber?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface AdminStatusPayload {
  status: ServiceStatus;
}

export const adminApi = {
  getStats: () => api.get<AdminStats>('/admin/stats'),

  listUsers: () => api.get<AdminUser[]>('/admin/users'),

  updateUser: (id: number, payload: AdminUserUpdatePayload) =>
    api.put<AdminUser>(`/admin/users/${id}`, payload),

  deleteUser: (id: number) => api.delete(`/admin/users/${id}`),

  listServices: () => api.get<AdminTourService[]>('/admin/services'),

  updateServiceStatus: (id: number, payload: AdminStatusPayload) =>
    api.patch<AdminTourService>(`/admin/services/${id}/status`, payload),

  deleteService: (id: number) => api.delete(`/admin/services/${id}`),

  listBusinesses: () => api.get<AdminBusiness[]>('/admin/businesses'),

  updateBusinessStatus: (id: number, payload: AdminStatusPayload) =>
    api.patch<AdminBusiness>(`/admin/businesses/${id}/status`, payload),

  deleteBusiness: (id: number) => api.delete(`/admin/businesses/${id}`),
};
