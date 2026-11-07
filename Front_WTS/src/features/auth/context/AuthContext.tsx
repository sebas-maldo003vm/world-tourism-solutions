import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { notifyAuthChanged } from '@/features/catalog/hooks/useFavorites';
import { profileApi } from '@/features/profile/services/profileApi';
import { isJwtValid } from '@/app/routes/ProtectedRoute';

export type AuthRole = 'USER' | 'PROVIDER' | 'ADMIN' | 'SUPPORT';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: AuthRole;
  phoneNumber?: string | null;
  profilePictureUrl?: string | null;
}

type UserUpdate = AuthUser | null | ((current: AuthUser | null) => AuthUser | null);

interface AuthContextValue {
  user: AuthUser | null;
  setUser: (update: UserUpdate) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USER_KEY = 'user';

export function normalizeAuthUser(raw: unknown): AuthUser | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const id = Number(record.id);
  if (!Number.isFinite(id)) {
    return null;
  }

  const picture = record.profilePictureUrl ?? record.profile_picture_url;
  const phone = record.phoneNumber ?? record.phone_number;

  return {
    ...(record as Partial<AuthUser>),
    id,
    name: typeof record.name === 'string' ? record.name : '',
    email: typeof record.email === 'string' ? record.email : '',
    role: (record.role as AuthRole) ?? 'USER',
    phoneNumber: typeof phone === 'string' ? phone : null,
    profilePictureUrl: typeof picture === 'string' && picture.trim() ? picture : null,
  };
}

function readStoredUser(): AuthUser | null {
  try {
    const token = localStorage.getItem('token');

    if (!isJwtValid(token)) {
      localStorage.removeItem('token');
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem('role');
      return null;
    }

    const raw = localStorage.getItem(USER_KEY);
    return raw ? normalizeAuthUser(JSON.parse(raw)) : null;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

function persistUser(user: AuthUser | null) {
  if (!user) {
    localStorage.removeItem(USER_KEY);
    return;
  }

  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(() => readStoredUser());
  const userRef = useRef(user);
  const revision = useRef(0);
  userRef.current = user;

  const setUser = useCallback((update: UserUpdate) => {
    revision.current += 1;
    const next = typeof update === 'function' ? update(userRef.current) : update;
    const normalized = next ? normalizeAuthUser(next) : null;
    persistUser(normalized);
    userRef.current = normalized;
    setUserState(normalized);
    notifyAuthChanged();
  }, []);

  const logout = useCallback(() => {
    revision.current += 1;
    localStorage.removeItem('token');
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('role');
    setUserState(null);
    notifyAuthChanged();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!isJwtValid(token)) {
      return;
    }

    const startedAt = revision.current;
    let cancelled = false;

    profileApi
      .getMyProfile()
      .then(({ data }) => {
        if (cancelled || revision.current !== startedAt) {
          return;
        }

        setUserState((current) => {
          const next = normalizeAuthUser({
            ...current,
            id: data.id,
            name: data.name,
            email: data.email,
            phoneNumber: data.phoneNumber,
            role: data.role,
            profilePictureUrl: data.profilePictureUrl ?? current?.profilePictureUrl ?? null,
          });
          persistUser(next);
          return next;
        });
      })
      .catch(() => {
        // La sesión local sigue siendo válida para pintar el avatar ya guardado.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({ user, setUser, logout }),
    [user, setUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
