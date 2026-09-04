import {
  Star,
  Heart,
  MapPin
} from 'lucide-react';

import { useState } from 'react';

import { Button } from '@/shared/components/ui/button';

import {
  Card,
  CardContent
} from '@/shared/components/ui/card';

import { Service } from '@/core/mocks/mockData';
import { ImageCarousel } from '@/shared/components/catalog/ImageCarousel';
import { useFavorites } from '@/features/catalog/hooks/useFavorites';

import { useNavigate } from 'react-router-dom';
import { contactProvider } from '@/features/chat/utils/contactProvider';

interface ServiceCardProps {
  service: Service;
}

export function ServiceCard({
  service
}: ServiceCardProps) {

  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [contacting, setContacting] = useState(false);

  const saved = isFavorite(service.id);

  // USER
  const user = localStorage.getItem('user');

  const isLogged = !!user;
  const images = service.imageUrls?.length
    ? service.imageUrls
    : [service.image];

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-shadow">

      {/* IMAGE */}
      <div className="relative aspect-[4/3] overflow-hidden">

        <ImageCarousel
          images={images}
          alt={service.name}
          className="h-full"
          imageClassName="group-hover:scale-105 transition-transform duration-300"
        />

        <Button
          size="icon"
          variant="ghost"
          onClick={(event) => {
            event.stopPropagation();
            toggleFavorite(service.id);
          }}
          className={`absolute top-3 right-3 rounded-full ${
            saved
              ? 'bg-white text-red-500'
              : 'bg-white/80 text-gray-600 hover:bg-white'
          }`}
        >

          <Heart
            className={`h-4 w-4 ${
              saved ? 'fill-current' : ''
            }`}
          />

        </Button>

      </div>

      {/* CONTENT */}
      <CardContent className="p-4">

        {/* TITLE */}
        <div className="flex items-start justify-between mb-2">

          <div className="flex-1">

            <h3 className="font-semibold text-lg mb-1">
              {service.name}
            </h3>

            <div className="flex items-center text-sm text-gray-600 mb-2">

              <MapPin className="h-3 w-3 mr-1" />

              {service.location}

            </div>

          </div>

        </div>

        {/* RATING */}
        <div className="flex items-center gap-2 mb-3">

          <div className="flex items-center">

            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />

            <span className="ml-1 font-medium">
              {service.rating}
            </span>

          </div>

          <span className="text-gray-400">
            •
          </span>

          <span className="text-sm text-gray-600">
            {service.category}
          </span>

        </div>

        {/* PRICE */}
        <div className="flex items-center justify-between mb-3">

          <div>

            <span className="text-2xl font-bold">
              ${service.price}
            </span>

            <span className="text-gray-600 text-sm ml-1">
              / persona
            </span>

          </div>

        </div>

        {/* BUTTONS */}
        <div className="grid grid-cols-2 gap-2">

          <Button
            variant="outline"
            onClick={() =>
              navigate(`/booking/${service.id}`)
            }
            className="rounded-full"
          >
            Ver más
          </Button>

          <Button
            onClick={() =>
              navigate(`/booking/${service.id}`)
            }
            className="bg-blue-600 hover:bg-blue-700 rounded-full"
          >
            Reservar
          </Button>

        </div>

        {/* CONTACTAR SOLO LOGUEADO */}
        {isLogged && (
          <Button
            variant="ghost"
            onClick={async () => {
              if (!service.providerId) {
                navigate('/chat');
                return;
              }
              setContacting(true);
              await contactProvider(navigate, service.providerId);
              setContacting(false);
            }}
            disabled={contacting}
            className="w-full mt-2 rounded-full text-sm"
          >
            {contacting ? 'Abriendo chat...' : 'Contactar'}
          </Button>
        )}

      </CardContent>

    </Card>
  );
}
