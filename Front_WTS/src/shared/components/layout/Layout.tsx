import { Outlet, useLocation } from 'react-router-dom';
import { Header } from '@/shared/components/layout/Header';
import { FavoritesProvider } from '@/features/catalog/hooks/useFavorites';

export function Layout() {

  const location = useLocation();

  const hiddenRoutes = [
    '/login',
    '/register'
  ];

  const hideHeader = hiddenRoutes.includes(location.pathname);

  return (
    <FavoritesProvider>
      <div className="min-h-screen bg-gray-50">

        {!hideHeader && <Header />}

        <Outlet />

      </div>
    </FavoritesProvider>
  );
}