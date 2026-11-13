import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Loader2, MapPin, SlidersHorizontal, Sparkles, Star } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { api } from '@/core/api/client';
import { FilterDrawer } from '@/shared/components/catalog/FilterDrawer';
import {
  categoryLabel,
  countActiveFilters,
  DEFAULT_FILTERS,
  matchesCatalogFilters,
  type Filters,
  type GeoPoint,
} from '@/shared/components/catalog/catalogFilters';
import {
  itineraryProposalsApi,
  type ItineraryProposal,
  type ProposalStatus,
} from '@/features/bookings/services/itineraryProposalsApi';
import {
  canonicalProposalCategory,
  PROPOSAL_QUOTAS,
  proposalShortageMessage,
  type ProposalBucket,
} from '@/features/bookings/utils/proposalRules';

interface CatalogBusiness {
  id: number;
  businessName?: string;
  description?: string;
  category?: string;
  city?: string;
  price?: number | string | null;
  avgRating?: number | string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
}

const money = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const STATUS_LABEL: Record<ProposalStatus, string> = {
  PROPOSED: 'Pendiente',
  ACCEPTED: 'Aceptada',
  CANCELLED: 'Cancelada',
};

function todayIso() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function readApiMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }
  return fallback;
}

function emptyCounts(): Record<ProposalBucket, number> {
  return { HOSPEDAJE: 0, RESTAURANTE: 0, ACTIVIDAD: 0 };
}

function normalizeCityKey(city: string) {
  return city
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

export function DayProposalPanel() {
  const [date, setDate] = useState(todayIso);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [userPosition, setUserPosition] = useState<GeoPoint | null>(null);
  const [catalog, setCatalog] = useState<CatalogBusiness[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [proposals, setProposals] = useState<ItineraryProposal[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setCatalogLoading(true);
    api
      .get<CatalogBusiness[]>('/businesses')
      .then((response) => {
        if (cancelled) return;
        setCatalog(Array.isArray(response.data) ? response.data : []);
        setCatalogError(null);
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;
        setCatalogError(readApiMessage(loadError, 'No se pudo cargar el catálogo aprobado.'));
      })
      .finally(() => {
        if (!cancelled) setCatalogLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!date) {
      setProposals([]);
      setSelectedId(null);
      setListLoading(false);
      return;
    }
    let cancelled = false;
    setListLoading(true);
    setError(null);
    itineraryProposalsApi
      .list(date)
      .then((response) => {
        if (cancelled) return;
        const rows = Array.isArray(response.data) ? response.data : [];
        setProposals(rows);
        const visibleRows = rows.filter((r) => r.status !== 'CANCELLED');
        setSelectedId(visibleRows[0]?.id ?? rows[0]?.id ?? null);
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;
        setProposals([]);
        setSelectedId(null);
        setError(readApiMessage(loadError, 'No se pudieron consultar las propuestas de este día.'));
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [date]);

  const categories = useMemo(
    () => Array.from(new Set(catalog.map((item) => item.category).filter(Boolean) as string[])),
    [catalog],
  );

  const locations = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of catalog) {
      if (item.city) {
        const key = normalizeCityKey(item.city);
        if (!map.has(key)) {
          map.set(key, item.city.trim());
        }
      }
    }
    return Array.from(map.values());
  }, [catalog]);

  const counts = useMemo(() => {
    const next = emptyCounts();
    const seen = new Set<number>();
    for (const business of catalog) {
      if (!Number.isFinite(business.id) || seen.has(business.id)) continue;
      const matches = matchesCatalogFilters(
        {
          name: business.businessName,
          description: business.description,
          category: business.category,
          city: business.city,
          price: business.price,
          avgRating: business.avgRating,
          latitude: business.latitude,
          longitude: business.longitude,
        },
        filters,
      );
      if (!matches) continue;
      const bucket = canonicalProposalCategory(business.category);
      if (!bucket) continue;
      seen.add(business.id);
      next[bucket] += 1;
    }
    return next;
  }, [catalog, filters]);

  const shortage = catalogLoading ? null : proposalShortageMessage(counts);
  const activeFilters = countActiveFilters(filters);

  // VALIDACIÓN ESTRICTA: Verifica que haya una ciudad seleccionada real o coordenadas GPS activas.
  // Ignora explícitamente cadenas vacías, espacios, 'todas las ubicaciones' o 'all'.
  const hasSelectedLocation = useMemo(() => {
    const loc = filters.location ? filters.location.trim().toLowerCase() : '';
    const isInvalidCity = !loc || loc === '' || loc === 'todas las ubicaciones' || loc === 'all';
    
    // Es válido si hay una ciudad específica o si el usuario activó "Usar mi ubicación" (userPosition)
    return !isInvalidCity || Boolean(userPosition);
  }, [filters.location, userPosition]);

  const visibleProposals = useMemo(
    () => proposals.filter((proposal) => proposal.status !== 'CANCELLED'),
    [proposals],
  );

  const selected = visibleProposals.find((proposal) => proposal.id === selectedId) ?? visibleProposals[0] ?? null;

  const replaceProposal = (updated: ItineraryProposal) => {
    setProposals((current) => {
      const exists = current.some((proposal) => proposal.id === updated.id);
      return exists
        ? current.map((proposal) => (proposal.id === updated.id ? updated : proposal))
        : [updated, ...current];
    });
    setSelectedId(updated.id);
  };

  const generate = async () => {
    if (!hasSelectedLocation) return;
    setGenerating(true);
    setError(null);
    try {
      const response = await itineraryProposalsApi.generate(date, filters);
      replaceProposal(response.data);
    } catch (generateError: unknown) {
      setError(readApiMessage(generateError, 'No se pudo generar la propuesta.'));
    } finally {
      setGenerating(false);
    }
  };

  const decide = async (action: 'accept' | 'cancel') => {
    if (!selected) return;
    setActing(true);
    setError(null);
    try {
      const response =
        action === 'accept'
          ? await itineraryProposalsApi.accept(selected.id)
          : await itineraryProposalsApi.cancel(selected.id);
      
      replaceProposal(response.data);

      if (action === 'cancel') {
        const remainingVisible = proposals
          .map((p) => (p.id === response.data.id ? response.data : p))
          .filter((p) => p.status !== 'CANCELLED');
        setSelectedId(remainingVisible[0]?.id ?? null);
      }
    } catch (actionError: unknown) {
      setError(
        readApiMessage(
          actionError,
          action === 'accept' ? 'No se pudo aceptar la propuesta.' : 'No se pudo cancelar la propuesta.',
        ),
      );
    } finally {
      setActing(false);
    }
  };

  return (
    <section className="mt-10 border-t border-gray-200 pt-8" aria-labelledby="day-proposal-title">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="day-proposal-title" className="text-2xl font-bold text-gray-900">
            Generar día
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Arma una propuesta informativa optimizada de 5 lugares: 1 hospedaje, 2 restaurantes y 2 actividades.
            Selecciona una ciudad o ubicación para calcular la ruta inteligente.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-5 p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="block min-w-0 sm:w-64">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">Fecha de la propuesta</span>
              <Input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="rounded-full"
              />
            </label>

            <div className="flex-1">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">Ciudad o Ubicación obligatoria</span>
              <Button
                type="button"
                variant="outline"
                className={`w-full justify-between rounded-full ${
                  hasSelectedLocation && filters.location ? 'border-blue-600 text-blue-700 font-medium' : 'text-gray-500'
                }`}
                aria-expanded={filtersOpen}
                onClick={() => setFiltersOpen(true)}
              >
                <span className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  {hasSelectedLocation && filters.location && filters.location.toLowerCase() !== 'todas las ubicaciones' && filters.location.toLowerCase() !== 'all'
                    ? `Ciudad: ${filters.location}`
                    : userPosition
                    ? 'Ubicación GPS activa'
                    : 'Seleccionar ciudad o ubicación...'}
                </span>
                {activeFilters > 0 && (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-xs font-semibold text-white">
                    {activeFilters}
                  </span>
                )}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {PROPOSAL_QUOTAS.map((quota) => {
              const available = counts[quota.category];
              const ready = available >= quota.required;
              return (
                <span
                  key={quota.category}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    catalogLoading
                      ? 'bg-gray-100 text-gray-500'
                      : ready
                        ? 'bg-emerald-50 text-emerald-800'
                        : 'bg-red-50 text-red-700'
                  }`}
                >
                  {quota.label}: {catalogLoading ? '…' : `${available}/${quota.required}`}
                </span>
              );
            })}
          </div>

          {catalogError && <p className="text-sm text-red-600">{catalogError}</p>}
          {shortage && !catalogError && <p className="text-sm text-red-600">{shortage}</p>}
          {!hasSelectedLocation && (
            <p className="text-sm font-medium text-amber-600">
              ⚠️ Debes seleccionar una ciudad específica o configurar una ubicación en los filtros para generar la propuesta optimizada.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              className="rounded-full bg-blue-600 hover:bg-blue-700"
              disabled={catalogLoading || generating || Boolean(shortage) || Boolean(catalogError) || !date || !hasSelectedLocation}
              onClick={() => void generate()}
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generar propuesta
            </Button>
            <p className="text-xs text-gray-500">
              El motor selecciona de forma inteligente y optimizada las mejores opciones por calidad y cercanía geográfica.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="mt-5">
        {listLoading ? (
          <div className="flex items-center justify-center gap-3 py-10 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Buscando propuestas de esta fecha...</span>
          </div>
        ) : selected ? (
          <ProposalResult
            proposal={selected}
            proposals={visibleProposals}
            acting={acting}
            onSelect={setSelectedId}
            onAccept={() => void decide('accept')}
            onCancel={() => void decide('cancel')}
          />
        ) : (
          <Card>
            <CardContent className="p-10 text-center text-sm text-gray-500">
              Todavía no hay una propuesta informativa activa para esta fecha.
            </CardContent>
          </Card>
        )}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      <FilterDrawer
        open={filtersOpen}
        filters={filters}
        categories={categories}
        locations={locations}
        userPosition={userPosition}
        onClose={() => setFiltersOpen(false)}
        onApply={(newFilters) => {
          // Si el usuario selecciona "Todas las ubicaciones" o lo limpia, aseguramos que location quede vacío
          const cleanedFilters = {
            ...newFilters,
            location: newFilters.location && newFilters.location.toLowerCase() !== 'todas las ubicaciones' && newFilters.location.toLowerCase() !== 'all' 
              ? newFilters.location 
              : ''
          };
          setFilters(cleanedFilters);
        }}
        onUserPositionChange={setUserPosition}
      />
    </section>
  );
}

function ProposalResult({
  proposal,
  proposals,
  acting,
  onSelect,
  onAccept,
  onCancel,
}: {
  proposal: ItineraryProposal;
  proposals: ItineraryProposal[];
  acting: boolean;
  onSelect: (id: number) => void;
  onAccept: () => void;
  onCancel: () => void;
}) {
  const pending = proposal.status === 'PROPOSED';

  return (
    <Card className="border-emerald-100">
      <CardContent className="p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Propuesta informativa
            </p>
            <h3 className="text-lg font-semibold text-gray-900">{proposal.title}</h3>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              proposal.status === 'ACCEPTED'
                ? 'bg-green-100 text-green-700'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {STATUS_LABEL[proposal.status] ?? proposal.status}
          </span>
        </div>

        {proposals.length > 1 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {proposals.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  item.id === proposal.id
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Propuesta {index + 1} · {STATUS_LABEL[item.status] ?? item.status}
              </button>
            ))}
          </div>
        )}

        <ol className="space-y-3">
          {proposal.items.map((item, index) => {
            const bucket = canonicalProposalCategory(item.category);
            const quota = PROPOSAL_QUOTAS.find((entry) => entry.category === bucket);
            return (
              <li key={item.id ?? `${item.providerProfileId}-${index}`} className="flex gap-3 rounded-xl border border-gray-100 p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-300 text-sm font-semibold text-emerald-700">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-gray-900">{item.businessName}</p>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      {quota?.label ?? categoryLabel(item.category || 'Lugar')}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                    {item.city && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {item.city}
                      </span>
                    )}
                    {item.avgRating != null && (
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3.5 w-3.5" />
                        {Number(item.avgRating).toFixed(1)}
                      </span>
                    )}
                    {item.price != null && <span>{money.format(Number(item.price))}</span>}
                  </div>
                  {item.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-gray-600">{item.description}</p>
                  )}
                  <Link
                    to={`/booking/${item.providerProfileId}`}
                    className="mt-1 inline-block text-sm font-medium text-blue-700 hover:underline"
                  >
                    Ver ficha
                  </Link>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-5 flex flex-wrap gap-3">
          {pending && (
            <>
              <Button
                type="button"
                className="rounded-full bg-blue-600 hover:bg-blue-700"
                disabled={acting}
                onClick={onAccept}
              >
                {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Aceptar propuesta
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                disabled={acting}
                onClick={onCancel}
              >
                Cancelar propuesta
              </Button>
            </>
          )}
          {proposal.status === 'ACCEPTED' && (
            <Button type="button" variant="outline" className="rounded-full" disabled={acting} onClick={onCancel}>
              Descartar propuesta
            </Button>
          )}
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Esta decisión solo cambia el estado de la propuesta. No reserva cupo ni contacta al proveedor.
        </p>
      </CardContent>
    </Card>
  );
}