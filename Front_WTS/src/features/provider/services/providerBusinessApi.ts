import { api } from '@/core/api/client';
import { uploadFiles } from '@/core/storage/supabaseStorage.service';

export interface ProviderBusinessPayload {
  businessName: string;
  taxId?: string;
  description: string;
  location: string;
  city: string;
  category: string;
  price: string;
  latitude?: string;
  longitude?: string;
  imageUrls?: string[];
}

export async function uploadServiceGallery(files: File[]): Promise<string[]> {
  return uploadFiles(files, 'service-gallery');
}

export const providerBusinessApi = {
  create: (payload: ProviderBusinessPayload) =>
    api.post('/provider/business', payload),

  update: (businessId: string, payload: ProviderBusinessPayload) =>
    api.put(`/provider/business/${businessId}`, payload),
};
