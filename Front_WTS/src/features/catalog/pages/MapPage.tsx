import { useState } from 'react';
import { MapView } from '@/shared/components/catalog/MapView';
import { FilterBar } from '@/shared/components/catalog/FilterBar';
import { mockServices, Service } from '@/core/mocks/mockData';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { X, UtensilsCrossed, Tent, Hotel, ArrowLeft } from 'lucide-react';

export function MapPage() {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredServices = selectedCategory
    ? mockServices.filter((s) => s.category === selectedCategory)
    : mockServices;

  return (
    <div className="h-screen flex flex-col">
      {/* Top Header */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Explorar Mapa</h1>
        </div>
      </div>


      {/* Category Quick Filters */}
      <div className="bg-white border-b px-4 py-3">
        <div className="max-w-7xl mx-auto flex gap-2 overflow-x-auto">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            onClick={() => setSelectedCategory(null)}
            className="rounded-full whitespace-nowrap"
            size="sm"
          >
            Todos
          </Button>
          <Button
            variant={selectedCategory === 'Restaurantes' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('Restaurantes')}
            className="rounded-full whitespace-nowrap gap-2"
            size="sm"
          >
            <UtensilsCrossed className="h-4 w-4" />
            Restaurantes
          </Button>
          <Button
            variant={selectedCategory === 'Actividades' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('Actividades')}
            className="rounded-full whitespace-nowrap gap-2"
            size="sm"
          >
            <Tent className="h-4 w-4" />
            Actividades
          </Button>
          <Button
            variant={selectedCategory === 'Hospedaje' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('Hospedaje')}
            className="rounded-full whitespace-nowrap gap-2"
            size="sm"
          >
            <Hotel className="h-4 w-4" />
            Hospedaje
          </Button>
        </div>
      </div>

      <div className="flex-1 relative">
       {/* <MapView services={filteredServices} onServiceClick={setSelectedService} />}

        {/* Floating Service Card */}
        {selectedService && (
          <Card className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md shadow-xl">
            <CardContent className="p-0">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setSelectedService(null)}
                className="absolute top-2 right-2 z-10 rounded-full bg-white/90"
              >
                <X className="h-4 w-4" />
              </Button>

              <div className="flex gap-4 p-4">
                <img
                  src={selectedService.image}
                  alt={selectedService.name}
                  className="w-24 h-24 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{selectedService.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{selectedService.location}</p>
                  <p className="font-bold text-blue-600">${selectedService.price} / persona</p>
                </div>
              </div>

              <div className="px-4 pb-4 flex gap-2">
                <Button
                  onClick={() => navigate(`/booking/${selectedService.id}`)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-full"
                >
                  Ver detalle
                </Button>
                <Button
                  onClick={() => navigate('/chat')}
                  variant="outline"
                  className="flex-1 rounded-full"
                >
                  Contactar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}