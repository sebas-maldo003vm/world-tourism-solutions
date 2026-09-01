import { Link, useNavigate } from 'react-router-dom';

import {
  Search,
  User,
  Map,
  Calendar,
  LogOut
} from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';

import { useEffect, useState } from 'react';

interface UserData {
  id: number;
  name: string;
  email: string;
  role: 'USER' | 'PROVIDER' | 'ADMIN';
}


export function Header() {

  const navigate = useNavigate();

  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {

    const storedUser = localStorage.getItem('user');

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

  }, []);

  const handleLogout = () => {

  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('role');
setUser(null);

  navigate('/', { replace: true });

};

  // LOGIN
  const isLogged = !!user;

  // ROLES
  const isTurista = user?.role === 'USER';

  const isAccesor = user?.role === 'PROVIDER';

  const isAdmin = user?.role === 'ADMIN';
  const getHomeRoute = () => {

    if (isAdmin) return '/admin';

    if (isAccesor) return '/dashboard-accesor';

    if (isTurista) return '/home-logueado';

    return '/';
  };
  return (
    <header className="border-b bg-white sticky top-0 z-50">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex items-center justify-between h-16">

          {/* LOGO */}
          <Link to={getHomeRoute()} className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center">

              <span className="text-white font-bold text-lg">
                WTS
              </span>

            </div>

            <span className="font-semibold text-xl hidden sm:block">
              World Tourism Solutions
            </span>

          </Link>

          {/* BUSCADOR */}
          {isTurista && (

            <div className="hidden md:flex items-center flex-1 max-w-md mx-8">

              <div className="relative w-full">

                
              </div>

            </div>
          )}

          {/* NAV */}
          <div className="hidden lg:flex items-center gap-1 mr-4">

            {isTurista && (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/map')}
                  className="gap-2"
                >
                  <Map className="h-4 w-4" />
                  Mapa
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => navigate('/itinerary')}
                  className="gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  Itinerario
                </Button>
              </>
            )}

            {isAdmin && (
              <Button
                variant="ghost"
                onClick={() => navigate('/admin')}
              >
                Dashboard Admin
              </Button>
            )}

           

          </div>

          {/* DERECHA */}
          <div className="flex items-center gap-3">

            {!isLogged ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/login')}
                  className="hidden sm:inline-flex"
                >
                  Iniciar sesión
                </Button>

                <Button
                  onClick={() => navigate('/register')}
                  className="bg-blue-600 hover:bg-blue-700 rounded-full"
                >
                  Registrarse
                </Button>
              </>
            ) : (
              <>
                <span className="max-w-[150px] truncate text-sm font-medium">
                  {user?.name}
                </span>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="rounded-full"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            )}

            {/* ICON USER */}
            {(isTurista || isAccesor) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/profile')}
                className="rounded-full"
              >
                <User className="h-5 w-5" />
              </Button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
}