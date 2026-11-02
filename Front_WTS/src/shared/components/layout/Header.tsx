import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Calendar,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  User,
} from 'lucide-react';
import { chatApi } from '@/features/chat/services/chatApi';
import { useAuth } from '@/features/auth/context/AuthContext';
import { UserAvatar } from '@/shared/components/UserAvatar';

const guestBtn =
  'inline-flex items-center justify-center rounded-full px-3 py-2 text-sm font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-100';
const primaryBtn =
  'inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-blue-700';
const navBtn =
  'inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-100';
const menuItem =
  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors duration-200 hover:bg-slate-50';

function getFirstName(name?: string) {
  const trimmed = name?.trim();
  if (!trimmed) return 'Usuario';
  return trimmed.split(/\s+/)[0];
}

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);

  const { user, logout } = useAuth();
  const [hasUnread, setHasUnread] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

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
  }, [user?.id, user?.role]);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/', { replace: true });
  };

  const goTo = (path: string) => {
    setMenuOpen(false);
    navigate(path);
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

  const showChat = isTurista || isAccesor || isStaff;
  const showPageNav = isTurista || isStaff;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link to={getHomeRoute()} className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-700">
              <span className="text-lg font-bold text-white">WTS</span>
            </div>
            <span className="hidden truncate text-xl font-semibold text-slate-900 sm:block">
              World Tourism Solutions
            </span>
          </Link>

          {isTurista && (
            <div className="mx-8 hidden max-w-md flex-1 items-center md:flex">
              <div className="relative w-full" />
            </div>
          )}

          <div className="flex shrink-0 items-center gap-3">
            {!isLogged ? (
              <>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className={`${guestBtn} hidden sm:inline-flex`}
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
                {isAccesor && (
                  <div className="hidden items-center gap-1 md:flex">
                    <button
                      type="button"
                      onClick={() => navigate('/dashboard-accesor')}
                      className={
                        location.pathname === '/dashboard-accesor'
                          ? 'inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700'
                          : navBtn
                      }
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Panel
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/analitica')}
                      className={
                        location.pathname === '/analitica'
                          ? 'inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700'
                          : navBtn
                      }
                    >
                      <BarChart3 className="h-4 w-4" />
                      Analítica
                    </button>
                  </div>
                )}

                {showPageNav && (
                  <div className="hidden items-center gap-1 md:flex">
                    {isTurista && (
                      <button
                        type="button"
                        onClick={() => navigate('/itinerary')}
                        className={navBtn}
                      >
                        <Calendar className="h-4 w-4" />
                        Itinerario
                      </button>
                    )}

                    {isStaff && (
                      <button
                        type="button"
                        onClick={() => navigate('/admin')}
                        className={navBtn}
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        {isSupport ? 'Panel Soporte' : 'Dashboard Admin'}
                      </button>
                    )}
                  </div>
                )}

                {showChat && (
                  <button
                    type="button"
                    onClick={() => navigate('/messages')}
                    className={`relative ${navBtn}`}
                    aria-label={hasUnread ? 'Mensajes, sin leer' : 'Mensajes'}
                  >
                    <span className="relative inline-flex">
                      <MessageSquare className="h-4 w-4" />
                      {hasUnread && (
                        <span
                          className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white"
                          aria-hidden="true"
                        />
                      )}
                    </span>
                    Mensajes
                  </button>
                )}

                {(showPageNav || showChat) && (
                  <span
                    className="h-6 w-px bg-slate-200"
                    aria-hidden="true"
                  />
                )}

                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setMenuOpen((open) => !open)}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-2.5 shadow-sm transition-colors duration-200 hover:bg-slate-50"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    aria-label="Menú de usuario"
                  >
                    <UserAvatar src={user?.profilePictureUrl} name={user?.name} size="sm" />
                    <span className="hidden max-w-[120px] truncate text-sm font-medium text-slate-800 sm:inline">
                      {getFirstName(user.name)}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${
                        menuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {menuOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-slate-100 bg-white py-1.5 shadow-md"
                    >
                      <div className="px-3 py-2.5">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {user.name}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {user.email}
                        </p>
                      </div>

                      <div className="mx-2 border-t border-slate-100" />

                      <div className="p-1.5">
                        {isAccesor && (
                          <>
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => goTo('/dashboard-accesor')}
                              className={menuItem}
                            >
                              <LayoutDashboard className="h-4 w-4 text-slate-500" />
                              Panel de prestador
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => goTo('/analitica')}
                              className={menuItem}
                            >
                              <BarChart3 className="h-4 w-4 text-slate-500" />
                              Analítica
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => goTo('/profile')}
                          className={menuItem}
                        >
                          <User className="h-4 w-4 text-slate-500" />
                          Mi Perfil
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => goTo('/profile?tab=bookings')}
                          className={menuItem}
                        >
                          <Calendar className="h-4 w-4 text-slate-500" />
                          Mis Reservas
                        </button>
                      </div>

                      <div className="mx-2 border-t border-slate-100" />

                      <div className="p-1.5">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 transition-colors duration-200 hover:bg-red-50"
                        >
                          <LogOut className="h-4 w-4" />
                          Cerrar sesión
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
