import { useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { FilterDrawer } from './FilterDrawer';
import {
  countActiveFilters,
  type Filters,
  type GeoPoint,
} from './catalogFilters';

export type { Filters, GeoPoint } from './catalogFilters';
export {
  DEFAULT_FILTERS,
  matchesCatalogFilters,
} from './catalogFilters';

interface FilterBarProps {
  filters: Filters;
  categories: string[];
  locations: string[];
  onFilterChange: (filters: Filters) => void;
  userPosition?: GeoPoint | null;
  onUserPositionChange?: (position: GeoPoint & { accuracy: number }) => void;
}

export function FilterBar({
  filters,
  categories,
  locations,
  onFilterChange,
  userPosition,
  onUserPositionChange,
}: FilterBarProps) {
  const [open, setOpen] = useState(false);
  const activeCount = countActiveFilters(filters);

  return (
    <div className="sticky top-16 z-40 border-b bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              value={filters.search}
              onChange={(event) =>
                onFilterChange({
                  ...filters,
                  search: event.target.value,
                })
              }
              placeholder="Buscar servicio..."
              aria-label="Buscar servicio"
              className="rounded-full pl-9"
            />
          </div>

          <Button
            type="button"
            variant="outline"
            aria-expanded={open}
            aria-controls="catalog-filter-drawer"
            aria-label={
              activeCount > 0 ? `Filtros, ${activeCount} activos` : 'Filtros'
            }
            onClick={() => setOpen(true)}
            className={`shrink-0 rounded-full ${
              activeCount > 0 ? 'border-blue-600 text-blue-700' : ''
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
            {activeCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-xs font-semibold text-white">
                {activeCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      <FilterDrawer
        open={open}
        filters={filters}
        categories={categories}
        locations={locations}
        userPosition={userPosition}
        onClose={() => setOpen(false)}
        onApply={onFilterChange}
        onUserPositionChange={onUserPositionChange}
      />
    </div>
  );
}
