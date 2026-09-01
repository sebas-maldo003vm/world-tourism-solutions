import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  favoritesApi,
  type FavoriteItem,
} from '@/features/catalog/services/favoritesApi';

interface FavoritesContextValue {
  favorites: FavoriteItem[];
  loading: boolean;
  isFavorite: (businessId: number | string) => boolean;
  toggleFavorite: (businessId: number | string) => Promise<void>;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

function isAuthenticated() {
  return Boolean(localStorage.getItem('token'));
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);

  const refreshFavorites = useCallback(async () => {
    if (!isAuthenticated()) {
      setFavorites([]);
      setFavoriteIds(new Set());
      return;
    }

    setLoading(true);

    try {
      const response = await favoritesApi.list();
      const items = response.data;

      setFavorites(items);
      setFavoriteIds(new Set(items.map((item) => item.business.id)));
    } catch (error) {
      console.error('Error cargando favoritos', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshFavorites();
  }, [refreshFavorites]);

  const isFavorite = useCallback(
    (businessId: number | string) => favoriteIds.has(Number(businessId)),
    [favoriteIds]
  );

  const toggleFavorite = useCallback(
    async (businessId: number | string) => {
      if (!isAuthenticated()) {
        navigate('/login');
        return;
      }

      const id = Number(businessId);

      try {
        if (isFavorite(id)) {
          await favoritesApi.remove(id);
          setFavoriteIds((current) => {
            const next = new Set(current);
            next.delete(id);
            return next;
          });
          setFavorites((current) =>
            current.filter((item) => item.business.id !== id)
          );
        } else {
          const response = await favoritesApi.add(id);
          setFavoriteIds((current) => new Set(current).add(id));
          setFavorites((current) => [response.data, ...current]);
        }
      } catch (error) {
        console.error('Error actualizando favorito', error);
        alert('No se pudo actualizar el favorito.');
      }
    },
    [isFavorite, navigate]
  );

  const value = useMemo(
    () => ({
      favorites,
      loading,
      isFavorite,
      toggleFavorite,
      refreshFavorites,
    }),
    [favorites, loading, isFavorite, toggleFavorite, refreshFavorites]
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);

  if (!context) {
    throw new Error('useFavorites debe usarse dentro de FavoritesProvider');
  }

  return context;
}
