import { getSupabaseClient } from '@/core/supabase/client';
import type { AuthRole } from '@/features/auth/context/AuthContext';

export type PublicAuthRole = Extract<AuthRole, 'USER' | 'PROVIDER'>;

export function toSpanishAuthError(error: unknown): string {
  const message =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message?: unknown }).message ?? '').trim()
      : error instanceof Error
        ? error.message.trim()
        : '';

  if (!message) {
    return 'No se pudo completar la operación con Supabase.';
  }

  if (/already registered|already been registered|user already exists/i.test(message)) {
    return 'Ya existe una cuenta con ese correo.';
  }

  if (/invalid email/i.test(message)) {
    return 'El correo no es válido.';
  }

  if (/password/i.test(message) && /at least|weak|short|characters/i.test(message)) {
    return 'La contraseña no cumple los requisitos de seguridad de Supabase.';
  }

  if (/rate limit|too many requests|over_request_rate_limit/i.test(message)) {
    return 'Demasiados intentos. Espera un momento e inténtalo de nuevo.';
  }

  if (/redirect/i.test(message)) {
    return 'No se pudo enviar el enlace. Agrega esta URL de redirección en la configuración de Supabase Auth.';
  }

  return message;
}

export async function requestPasswordReset(email: string): Promise<void> {
  const supabase = getSupabaseClient();
  const redirectTo = new URL('/update-password', window.location.origin).toString();
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo,
  });

  if (error) {
    throw error;
  }
}
