import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';

export type AppRole = 'ADMIN' | 'SUPPORT' | 'PROVIDER' | 'USER';

interface ProtectedRouteProps {
  children: ReactNode;
  /** Si se omite, cualquier rol autenticado puede entrar. */
  allowedRoles?: AppRole[];
  /** Destino cuando el rol no tiene permiso (por defecto /home-logueado). */
  unauthorizedRedirect?: string;
}

function readSession(): { token: string | null; role: AppRole | null } {
  const token = localStorage.getItem('token');
  try {
    const raw = localStorage.getItem('user');
    const user = raw ? (JSON.parse(raw) as { role?: string }) : null;
    const role = user?.role as AppRole | undefined;
    return { token, role: role ?? null };
  } catch {
    return { token, role: null };
  }
}

/** Valida estructura JWT y expiración (exp) sin verificar firma en cliente. */
export function isJwtValid(token: string | null | undefined): boolean {
  if (!token || token.split('.').length !== 3) {
    return false;
  }

  try {
    const payloadPart = token.split('.')[1];
    const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    const payload = JSON.parse(atob(padded)) as { exp?: number };

    if (typeof payload.exp === 'number' && Date.now() >= payload.exp * 1000) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Guard de navegación por URL: exige JWT válido y, opcionalmente, roles concretos.
 * Sin sesión → /login. Con sesión pero sin permiso → /home-logueado.
 */
export function ProtectedRoute({
  children,
  allowedRoles,
  unauthorizedRedirect = '/home-logueado',
}: ProtectedRouteProps) {
  const location = useLocation();
  const { token, role } = readSession();

  if (!isJwtValid(token)) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!role || !allowedRoles.includes(role)) {
      return <Navigate to={unauthorizedRedirect} replace />;
    }
  }

  return <>{children}</>;
}
