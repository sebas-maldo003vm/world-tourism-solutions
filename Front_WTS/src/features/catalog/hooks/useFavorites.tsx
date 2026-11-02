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

export const AUTH_CHANGED_EVENT = 'wts:auth-changed';

export function notifyAuthChanged() {
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

interface FavoritesContextValue {
  favorites: FavoriteItem[];
  loading: boolean;
  isFavorite: (businessId: number | string) => boolean;
  toggleFavorite: (businessId: number | string) => Promise<void>;
  refreshFavorites: () => Promise<void>;
  clearFavorites: () => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

function readAuthUserId(): number | null {
  const token = localStorage.getItem('token');
  const raw = localStorage.getItem('user');
  if (!token || !raw) {
    return null;
  }
  try {
    const id = Number(JSON.parse(raw).id);
    return Number.isFinite(id) ? id : null;
  } catch {
    return null;
  }
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [authUserId, setAuthUserId] = useState<number | null>(() => readAuthUserId());
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);

  const clearFavorites = useCallback(() => {
    setFavorites([]);
    setFavoriteIds(new Set());
  }, []);

  const refreshFavorites = useCallback(async () => {
    const userId = readAuthUserId();
    if (userId == null) {
      clearFavorites();
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
      clearFavorites();
    } finally {
      setLoading(false);
    }
  }, [clearFavorites]);

  useEffect(() => {
    const syncAuth = () => {
      const nextId = readAuthUserId();
      setAuthUserId((current) => {
        if (current !== nextId) {
          clearFavorites();
        }
        return nextId;
      });
    };

    window.addEventListener('storage', syncAuth);
    window.addEventListener(AUTH_CHANGED_EVENT, syncAuth);

    return () => {
      window.removeEventListener('storage', syncAuth);
      window.removeEventListener(AUTH_CHANGED_EVENT, syncAuth);
    };
  }, [clearFavorites]);

  useEffect(() => {
    refreshFavorites();
  }, [authUserId, refreshFavorites]);

  const isFavorite = useCallback(
    (businessId: number | string) => favoriteIds.has(Number(businessId)),
    [favoriteIds]
  );

  const toggleFavorite = useCallback(
    async (businessId: number | string) => {
      if (readAuthUserId() == null) {
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
      clearFavorites,
    }),
    [favorites, loading, isFavorite, toggleFavorite, refreshFavorites, clearFavorites]
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
