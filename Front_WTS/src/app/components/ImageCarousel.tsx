import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from './ui/button';
import { API_ORIGIN } from '../Services/api';

interface ImageCarouselProps {
  images: string[];
  alt: string;
  className?: string;
  imageClassName?: string;
}

function normalizeImageUrl(image: string) {
  if (
    image.startsWith('http://') ||
    image.startsWith('https://') ||
    image.startsWith('blob:')
  ) {
    return image;
  }

  if (image.startsWith('/')) {
    return `${API_ORIGIN}${image}`;
  }

  return image;
}

export function ImageCarousel({
  images,
  alt,
  className = '',
  imageClassName = '',
}: ImageCarouselProps) {
  const validImages = images
    .filter(Boolean)
    .map(normalizeImageUrl);
  const carouselImages =
    validImages.length > 0
      ? validImages
      : ['https://via.placeholder.com/400'];

  const [currentImage, setCurrentImage] = useState(0);
  const hasMultipleImages = carouselImages.length > 1;

  useEffect(() => {
    setCurrentImage(0);
  }, [carouselImages.join('|')]);

  const showPrevious = () => {
    setCurrentImage((index) =>
      index === 0 ? carouselImages.length - 1 : index - 1
    );
  };

  const showNext = () => {
    setCurrentImage((index) =>
      index === carouselImages.length - 1 ? 0 : index + 1
    );
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={carouselImages[currentImage]}
        alt={alt}
        className={`w-full h-full object-cover ${imageClassName}`}
      />

      {hasMultipleImages && (
        <>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={showPrevious}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/85 text-gray-700 hover:bg-white"
            aria-label="Imagen anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={showNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/85 text-gray-700 hover:bg-white"
            aria-label="Siguiente imagen"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {carouselImages.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => setCurrentImage(index)}
                className={`h-2 w-2 rounded-full ${
                  currentImage === index ? 'bg-white' : 'bg-white/50'
                }`}
                aria-label={`Ver imagen ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
