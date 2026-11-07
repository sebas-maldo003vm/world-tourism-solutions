
import { Navigate } from 'react-router-dom';
import { Home } from '@/features/catalog/pages/Home';
import { useAuth } from '@/features/auth/context/AuthContext';
import { isJwtValid } from '@/app/routes/ProtectedRoute';

export function IndexRoute() {
  const { user } = useAuth();
  const token = localStorage.getItem('token');

  // Sin sesión válida, mostrar el catálogo público.
  if (!isJwtValid(token) || !user) {
    return <Home />;
  }

  // Redirigir según el rol del usuario.
  switch (user.role) {
    case 'ADMIN':
    case 'SUPPORT':
      return <Navigate to="/admin" replace />;

    case 'PROVIDER':
      return <Navigate to="/dashboard-accesor" replace />;

    case 'USER':
      return <Navigate to="/home-logueado" replace />;

    default:
      return <Home />;
  }
}
