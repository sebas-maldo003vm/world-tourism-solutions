import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Map,
  Calendar,
  LogOut,
  MessageSquare,
} from 'lucide-react';
import { chatApi } from '@/features/chat/services/chatApi';
import { notifyAuthChanged } from '@/features/catalog/hooks/useFavorites';

interface UserData {
  id: number;
  name: string;
  email: string;
  role: 'USER' | 'PROVIDER' | 'ADMIN' | 'SUPPORT';
}

const ghostBtn =
  'inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100';
const iconBtn =
  'inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-700 transition-colors hover:bg-gray-100';
const primaryBtn =
  'inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700';

export function Header() {
  const navigate = useNavigate();

  const [user, setUser] = useState<UserData | null>(null);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setHasUnread(false);
      return;
    }

    let cancelled = false;

    const fetchUnread = async () => {
      try {
        const { data } = await chatApi.listConversations();
        if (!cancelled) {
          const isStaffUser = user.role === 'ADMIN' || user.role === 'SUPPORT';
          // Badge del icono Mensajes: bandeja comercial (proveedores).
          // Staff también ve soporte; el resto no cuenta tickets/bot en el indicador.
          setHasUnread(
            data.some((c) => {
              if (c.unreadCount <= 0) return false;
              if (isStaffUser) return true;
              return c.conversationType === 'CLIENT_TO_PROVIDER';
            }),
          );
        }
      } catch {
        if (!cancelled) {
          setHasUnread(false);
        }
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    setUser(null);
    notifyAuthChanged();

    navigate('/', { replace: true });
  };

  const isLogged = !!user;
  const isTurista = user?.role === 'USER';
  const isAccesor = user?.role === 'PROVIDER';
  const isAdmin = user?.role === 'ADMIN';
  const isSupport = user?.role === 'SUPPORT';
  const isStaff = isAdmin || isSupport;

  const getHomeRoute = () => {
    if (isStaff) return '/admin';
    if (isAccesor) return '/dashboard-accesor';
    if (isTurista) return '/home-logueado';
    return '/';
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* LOGO */}
          <Link to={getHomeRoute()} className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-700">
              <span className="text-lg font-bold text-white">WTS</span>
            </div>
            <span className="hidden text-xl font-semibold sm:block">
              World Tourism Solutions
            </span>
          </Link>

          {/* BUSCADOR */}
          {isTurista && (
            <div className="mx-8 hidden max-w-md flex-1 items-center md:flex">
              <div className="relative w-full" />
            </div>
          )}

          {/* NAV */}
          <div className="mr-4 hidden items-center gap-1 lg:flex">
            {isTurista && (
              <>
                <button
                  type="button"
                  onClick={() => navigate('/map')}
                  className={ghostBtn}
                >
                  <Map className="h-4 w-4" />
                  Mapa
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/itinerary')}
                  className={ghostBtn}
                >
                  <Calendar className="h-4 w-4" />
                  Itinerario
                </button>
              </>
            )}

            {isStaff && (
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className={ghostBtn}
              >
                {isSupport ? 'Panel Soporte' : 'Dashboard Admin'}
              </button>
            )}
          </div>

          {/* DERECHA */}
          <div className="flex items-center gap-3">
            {!isLogged ? (
              <>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className={`${ghostBtn} hidden sm:inline-flex`}
                >
                  Iniciar sesión
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className={primaryBtn}
                >
                  Registrarse
                </button>
              </>
            ) : (
              <>
                <span className="max-w-[150px] truncate text-sm font-medium">
                  {user?.name}
                </span>

                <button
                  type="button"
                  onClick={handleLogout}
                  className={iconBtn}
                  aria-label="Cerrar sesión"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            )}

            {/* ICON CHAT — acceso global a /chat */}
            {(isTurista || isAccesor || isStaff) && (
              <button
                type="button"
                onClick={() => navigate('/chat')}
                className={`relative ${iconBtn}`}
                aria-label={hasUnread ? 'Mensajes (sin leer)' : 'Mensajes'}
              >
                <MessageSquare className="h-5 w-5" />
                {hasUnread && (
                  <span
                    className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white"
                    aria-hidden="true"
                  />
                )}
              </button>
            )}

            {/* ICON USER */}
            {(isTurista || isAccesor) && (
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className={iconBtn}
                aria-label="Perfil"
              >
                <User className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
