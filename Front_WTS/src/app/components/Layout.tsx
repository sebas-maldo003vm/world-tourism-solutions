import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';

export function Layout() {

  const location = useLocation();

  const hiddenRoutes = [
    '/login',
    '/register'
  ];

  const hideHeader = hiddenRoutes.includes(location.pathname);

  return (
    <div className="min-h-screen bg-gray-50">

      {!hideHeader && <Header />}

      <Outlet />

    </div>
  );
}