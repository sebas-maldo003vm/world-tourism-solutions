import { useEffect, useState } from 'react';
import { ServiceCard } from '@/shared/components/catalog/ServiceCard';
import { FilterBar, Filters } from '@/shared/components/catalog/FilterBar';
import { api } from '@/core/api/client';

interface Business {
  id: number;
  providerUserId?: number;
  businessName?: string;
  title?: string;
  description?: string;
  category?: string;
  price?: number;
  city?: string;
  location?: string;
  imageUrl?: string;
  imageUrls?: string[];
  images?: string[];
}

export function Home() {
  const [showMap, setShowMap] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    category: 'all',
    price: 'all',
    location: 'all',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    try {
      const response = await api.get('/businesses');

      setBusinesses(
        Array.isArray(response.data)
          ? response.data
          : [response.data]
      );
    } catch (error) {
      console.error(error);
      alert('Error cargando servicios');
    } finally {
      setLoading(false);
    }
  };

  const getBusinessName = (business: Business) =>
    business.businessName || business.title || 'Servicio';

  const getBusinessLocation = (business: Business) =>
    [business.city, business.location].filter(Boolean).join(', ') ||
    'Sin ubicación';

  const categories = Array.from(
    new Set(
      businesses
        .map((business) => business.category)
        .filter(Boolean) as string[]
    )
  );

  const locations = Array.from(
    new Set(
      businesses
        .map((business) => business.city || business.location)
        .filter(Boolean) as string[]
    )
  );

  const matchesPrice = (price = 0) => {
    if (filters.price === 'low') {
      return price <= 50000;
    }

    if (filters.price === 'medium') {
      return price > 50000 && price <= 150000;
    }

    if (filters.price === 'high') {
      return price > 150000;
    }

    return true;
  };

  const filteredBusinesses = businesses.filter((business) => {
    const search = filters.search.trim().toLowerCase();
    const searchableText = [
      getBusinessName(business),
      business.description,
      business.category,
      business.city,
      business.location,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const matchesSearch = !search || searchableText.includes(search);
    const matchesCategory =
      filters.category === 'all' || business.category === filters.category;
    const matchesLocation =
      filters.location === 'all' ||
      business.city === filters.location ||
      business.location === filters.location;

    return (
      matchesSearch &&
      matchesCategory &&
      matchesLocation &&
      matchesPrice(business.price)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <FilterBar
        filters={filters}
        categories={categories}
        locations={locations}
        onFilterChange={setFilters}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        <div className="flex gap-6">
          {/* Results Grid */}
          <div className={`flex-1 ${showMap ? 'hidden lg:block' : ''}`}>
            <div className="mb-4">
              <h2 className="text-2xl font-semibold">Explora experiencias únicas</h2>
              <p className="text-gray-600 mt-1">{filteredBusinesses.length} resultados encontrados</p>
            </div>

            {loading ? (
              <p>Cargando...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredBusinesses.map((business) => (
                  <ServiceCard
                    key={business.id}
                    service={{
                      id: business.id.toString(),
                      providerUserId: business.providerUserId,
                      name: getBusinessName(business),
                      description: business.description || '',
                      category: business.category || 'Actividades',
                      price: business.price || 0,
                      rating: 0,
                      image: business.imageUrl || '',
                      imageUrls:
                        business.imageUrls?.length
                          ? business.imageUrls
                          : business.images,
                      location:
                        getBusinessLocation(business),
                      lat: 0,
                      lng: 0,
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          
          
        </div>
      </div>
    </div>
  );
}
