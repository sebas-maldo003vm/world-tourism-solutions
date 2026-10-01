/** Modelo de catálogo usado por ServiceCard y páginas de descubrimiento. */
export interface Service {
  id: string;
  providerId?: number;
  providerUserId?: number;
  name: string;
  category: string;
  price: number;
  rating: number;
  image: string;
  imageUrls?: string[];
  location: string;
  description: string;
  lat: number;
  lng: number;
}
