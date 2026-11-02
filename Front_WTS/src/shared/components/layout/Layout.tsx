import { Outlet, useLocation } from 'react-router-dom';
import { Header } from '@/shared/components/layout/Header';
import { AuthProvider } from '@/features/auth/context/AuthContext';
import { FavoritesProvider } from '@/features/catalog/hooks/useFavorites';
import { ChatWidget } from '@/features/chat/components/ChatWidget';

export function Layout() {

  const location = useLocation();

  const hiddenRoutes = [
    '/login',
    '/register',
    '/forgot-password',
    '/update-password',
  ];

  const hideHeader = hiddenRoutes.includes(location.pathname);
  // Widget del asistente virtual: oculto solo en auth y admin; visible en /chat
  // para no mezclar el bot con la bandeja comercial de proveedores.
  const hideChatWidget = hideHeader || location.pathname.startsWith('/admin');

  return (
    <AuthProvider>
      <FavoritesProvider>
        <div className="min-h-screen overflow-x-hidden bg-gray-50">

          {!hideHeader && <Header />}

          <Outlet />

          {!hideChatWidget && <ChatWidget />}

        </div>
      </FavoritesProvider>
    </AuthProvider>
  );
}