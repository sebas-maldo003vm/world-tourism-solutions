import { useEffect, useState } from 'react';

import { ServiceCard } from '@/shared/components/catalog/ServiceCard';

import { FilterBar, Filters } from '@/shared/components/catalog/FilterBar';

import { MapView } from '@/shared/components/catalog/MapView';

import { useNavigate } from 'react-router-dom';

import { Button } from '@/shared/components/ui/button';

import { Map } from 'lucide-react';

import { api } from '@/core/api/client';

interface Service {
  id: number;
  providerUserId?: number;
  businessName?: string;
  title?: string;
  description?: string;
  category?: string;
  price?: number;
  city?: string;
  location?: string;
  latitude?: number | string;
  longitude?: number | string;
  imageUrl?: string;
  imageUrls?: string[];
  images?: string[];
}

export function HomeUsuarioLogueado() {

  const navigate = useNavigate();

  const [showMap, setShowMap] =
    useState(false);

  const [services, setServices] =
    useState<Service[]>([]);

  const [filters, setFilters] =
    useState<Filters>({
      search: '',
      category: 'all',
      price: 'all',
      location: 'all',
    });

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {

    try {

      const response =
        await api.get('/businesses');

      setServices(
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

  const getServiceName = (service: Service) =>
    service.businessName || service.title || 'Servicio';

  const getServiceLocation = (service: Service) =>
    [service.city, service.location].filter(Boolean).join(', ') ||
    'Sin ubicación';

  const categories = Array.from(
    new Set(
      services
        .map((service) => service.category)
        .filter(Boolean) as string[]
    )
  );

  const locations = Array.from(
    new Set(
      services
        .map((service) => service.city || service.location)
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

  const filteredServices = services.filter((service) => {
    const search = filters.search.trim().toLowerCase();
    const searchableText = [
      getServiceName(service),
      service.description,
      service.category,
      service.city,
      service.location,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const matchesSearch = !search || searchableText.includes(search);
    const matchesCategory =
      filters.category === 'all' || service.category === filters.category;
    const matchesLocation =
      filters.location === 'all' ||
      service.city === filters.location ||
      service.location === filters.location;

    return (
      matchesSearch &&
      matchesCategory &&
      matchesLocation &&
      matchesPrice(service.price)
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

        <div className="lg:hidden mb-4">

          <Button
            onClick={() =>
              setShowMap(!showMap)
            }
            variant="outline"
            className="w-full rounded-full"
          >

            <Map className="h-4 w-4 mr-2" />

            {showMap
              ? 'Ver lista'
              : 'Ver mapa'}

          </Button>

        </div>

        <div className="flex gap-6">

          <div className={`flex-1 ${
            showMap
              ? 'hidden lg:block'
              : ''
          }`}>

            <div className="mb-4">

              <h2 className="text-2xl font-semibold">
                Explora experiencias únicas
              </h2>

              <p className="text-gray-600 mt-1">
                {filteredServices.length}
                {' '}
                resultados encontrados
              </p>

            </div>

            {loading ? (

              <p>Cargando...</p>

            ) : (

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

                {filteredServices.map((service) => (

                  <ServiceCard
                    key={service.id}
                    service={{
                      id: service.id.toString(),
                      providerUserId: service.providerUserId,
                      name: getServiceName(service),
                      description:
                        service.description || '',
                      category:
                        service.category || 'Actividades',
                      price:
                        service.price || 0,
                      rating:
                        0,
                      location:
                        getServiceLocation(service),
                      image:
                        service.imageUrl || '',
                      imageUrls:
                        service.imageUrls?.length
                          ? service.imageUrls
                          : service.images,
                      lat:
                        0,
                      lng:
                        0,
                    }}
                  />

                ))}

              </div>

            )}

          </div>

          <div className={`${
            showMap
              ? 'block'
              : 'hidden lg:block'
          } w-full lg:w-[400px] xl:w-[500px]`}>

            <div className="sticky top-32">

              <div className="h-[calc(100vh-200px)]">

                <MapView
                  services={filteredServices.map(s => ({
                    id: s.id.toString(),
                    name: getServiceName(s),
                    location: getServiceLocation(s),
                    image: s.imageUrl || '',
                    price: s.price || 0,
                    latitude: s.latitude,
                    longitude: s.longitude,
                  }))}
                  onServiceClick={(service) =>
                    navigate(
                      `/booking/${service.id}`
                    )
                  }
                />

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
