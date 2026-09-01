import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';

export interface Filters {
  search: string;
  category: string;
  price: string;
  location: string;
}

const DEFAULT_CATEGORIES = [
  'RESTAURANTE',
  'ACTIVIDAD',
  'HOSPEDAJE',
  'TRANSPORTE',
  'TOUR',
  'OTRO',
];

interface FilterBarProps {
  filters: Filters;
  categories: string[];
  locations: string[];
  onFilterChange: (filters: Filters) => void;
}

export function FilterBar({
  filters,
  categories,
  locations,
  onFilterChange,
}: FilterBarProps) {
  const updateFilter = (name: keyof Filters, value: string) => {
    onFilterChange({
      ...filters,
      [name]: value,
    });
  };

  const clearFilters = () => {
    onFilterChange({
      search: '',
      category: 'all',
      price: 'all',
      location: 'all',
    });
  };

  const categoryOptions = Array.from(
    new Set([...DEFAULT_CATEGORIES, ...categories])
  );

  const hasActiveFilters =
    filters.search ||
    filters.category !== 'all' ||
    filters.price !== 'all' ||
    filters.location !== 'all';

  return (
    <div className="bg-white border-b sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-[260px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />

            <Input
              value={filters.search}
              onChange={(event) => updateFilter('search', event.target.value)}
              placeholder="Buscar servicio"
              className="rounded-full pl-9"
            />
          </div>

          {/* Category */}
          <Select
            value={filters.category}
            onValueChange={(value) => updateFilter('category', value)}
          >
            <SelectTrigger className="w-[180px] rounded-full">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent >
              
              <SelectItem value="all">Todas Categorias</SelectItem>
              {categoryOptions.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Price */}
          <Select
            value={filters.price}
            onValueChange={(value) => updateFilter('price', value)}
          >
            <SelectTrigger className="w-[150px] rounded-full">
              <SelectValue placeholder="Precio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Precios</SelectItem>
              <SelectItem value="low">$ - Económico</SelectItem>
              <SelectItem value="medium">$$ - Moderado</SelectItem>
              <SelectItem value="high">$$$ - Alto</SelectItem>
            </SelectContent>
          </Select>

          {/* Location */}
          <Select
            value={filters.location}
            onValueChange={(value) => updateFilter('location', value)}
          >
            <SelectTrigger className="w-[180px] rounded-full">
              <SelectValue placeholder="Ubicación" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Ubicaciones</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* More Filters Button */}
          {hasActiveFilters ? (
            <Button
              type="button"
              variant="outline"
              onClick={clearFilters}
              className="rounded-full ml-auto"
            >
              <X className="h-4 w-4 mr-2" />
              Limpiar
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="rounded-full ml-auto"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
