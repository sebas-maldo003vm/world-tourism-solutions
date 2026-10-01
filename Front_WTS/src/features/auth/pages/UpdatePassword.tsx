import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import type { Session } from '@supabase/supabase-js';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, Lock } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { api } from '@/core/api/client';
import { getSupabaseClient } from '@/core/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';

const MIN_PASSWORD_LENGTH = 8;
const LOGIN_REDIRECT_MS = 3000;

type SessionStatus = 'checking' | 'ready' | 'invalid';

interface ResetPasswordPayload {
  email: string;
  newPassword: string;
  accessToken: string;
}

interface ApiErrorBody {
  message?: string;
}

interface FieldFeedback {
  newPasswordError: string | null;
  newPasswordSuccess: string | null;
  confirmError: string | null;
  confirmSuccess: string | null;
}

function parseHashParams(hash: string): URLSearchParams {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  return new URLSearchParams(raw);
}

// El módulo se evalúa en la carga inicial, antes de crear el cliente de
// Supabase y antes de cualquier replaceState. Así conservamos los tokens
// aunque algo deje la barra en /update-password#.
const recoveryHashOnLoad = typeof window !== 'undefined' ? window.location.hash : '';

function readRecoveryParams(): URLSearchParams {
  const live = parseHashParams(window.location.hash);
  if (live.get('access_token') && live.get('refresh_token')) {
    return live;
  }
  return parseHashParams(recoveryHashOnLoad);
}

function clearRecoveryHash() {
  window.history.replaceState(
    window.history.state,
    '',
    `${window.location.pathname}${window.location.search}`,
  );
}

interface RecoveryBootstrap {
  session: Session | null;
  error: string | null;
}

let recoveryBootstrap: Promise<RecoveryBootstrap> | null = null;

function bootstrapRecoverySession(): Promise<RecoveryBootstrap> {
  if (recoveryBootstrap) {
    return recoveryBootstrap;
  }

  const hashParams = readRecoveryParams();

  recoveryBootstrap = (async () => {
    try {
      const urlError = hashParams.get('error_description') ?? hashParams.get('error');
      if (urlError) {
        return {
          session: null,
          error: decodeURIComponent(urlError.replace(/\+/g, ' ')),
        };
      }

      const type = hashParams.get('type');
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (type && type !== 'recovery') {
        return {
          session: null,
          error: 'Este enlace no corresponde a un restablecimiento de contraseña.',
        };
      }

      const supabase = getSupabaseClient();

      if (accessToken && refreshToken) {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          return { session: null, error: error.message };
        }

        if (data.session?.access_token && data.session.user.email) {
          clearRecoveryHash();
          return { session: data.session, error: null };
        }

        return {
          session: null,
          error:
            'No hay una sesión de recuperación activa o el enlace ha expirado. Solicita uno nuevo.',
        };
      }

      const { data, error } = await supabase.auth.getSession();
      if (!error && data.session?.access_token && data.session.user.email) {
        return { session: data.session, error: null };
      }

      return {
        session: null,
        error:
          'No hay una sesión de recuperación activa o el enlace ha expirado. Solicita uno nuevo.',
      };
    } catch (error) {
      return { session: null, error: toErrorMessage(error) };
    }
  })();

  return recoveryBootstrap;
}

function getFieldFeedback(newPassword: string, confirmPassword: string): FieldFeedback {
  const newPasswordError =
    newPassword.length > 0 && newPassword.length < MIN_PASSWORD_LENGTH
      ? `Debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`
      : null;
  const newPasswordSuccess =
    newPassword.length >= MIN_PASSWORD_LENGTH
      ? 'La contraseña cumple con la longitud mínima.'
      : null;

  let confirmError: string | null = null;
  let confirmSuccess: string | null = null;
  if (confirmPassword.length > 0 && newPassword !== confirmPassword) {
    confirmError = 'Las contraseñas no coinciden.';
  } else if (
    confirmPassword.length > 0 &&
    newPassword === confirmPassword &&
    newPasswordSuccess
  ) {
    confirmSuccess = 'Las contraseñas coinciden.';
  }

  return { newPasswordError, newPasswordSuccess, confirmError, confirmSuccess };
}

function toErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
    return 'No se pudo sincronizar la contraseña con el servidor.';
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'No se pudo actualizar la contraseña.';
}

export function UpdatePassword() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('checking');
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const redirectTimer = useRef<number | null>(null);
  const sessionReady = useRef(false);

  const feedback = getFieldFeedback(newPassword, confirmPassword);
  const canSubmit =
    sessionStatus === 'ready' &&
    !feedback.newPasswordError &&
    !feedback.confirmError &&
    newPassword.length >= MIN_PASSWORD_LENGTH &&
    confirmPassword.length > 0 &&
    !successMessage;

  useEffect(() => {
    return () => {
      if (redirectTimer.current !== null) {
        window.clearTimeout(redirectTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    let active = true;

    const applySession = (session: Session | null) => {
      if (!active || !session?.access_token || !session.user.email) {
        return false;
      }

      sessionReady.current = true;
      setEmail(session.user.email);
      setAccessToken(session.access_token);
      setSessionError(null);
      setSessionStatus('ready');
      return true;
    };

    const markInvalid = (message: string) => {
      if (!active || sessionReady.current) {
        return;
      }
      setSessionError(message);
      setSessionStatus('invalid');
    };

    void bootstrapRecoverySession().then((result) => {
      if (!active) {
        return;
      }
      if (applySession(result.session)) {
        return;
      }
      markInvalid(
        result.error ??
          'No hay una sesión de recuperación activa o el enlace ha expirado. Solicita uno nuevo.',
      );
    });

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading || successMessage || !canSubmit || !email || !accessToken) {
      return;
    }

    setLoading(true);
    setFormError(null);

    try {
      const supabase = getSupabaseClient();
      const { error: supabaseError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (supabaseError) {
        throw supabaseError;
      }

      const payload: ResetPasswordPayload = {
        email,
        newPassword,
        accessToken,
      };
      await api.put<void>('/auth/reset-password', payload);

      await supabase.auth.signOut();
      logout();

      setSuccessMessage(
        'Contraseña actualizada. Te llevaremos al inicio de sesión en unos segundos.',
      );
      redirectTimer.current = window.setTimeout(() => {
        navigate('/login', { replace: true });
      }, LOGIN_REDIRECT_MS);
    } catch (error) {
      setFormError(toErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="space-y-1">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Lock className="h-5 w-5" />
          </div>
          <CardTitle className="text-2xl text-center">Nueva contraseña</CardTitle>
          <CardDescription className="text-center">
            Elige una contraseña de al menos {MIN_PASSWORD_LENGTH} caracteres para tu cuenta.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {sessionStatus === 'checking' && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Verificando enlace de recuperación...
            </div>
          )}

          {sessionStatus === 'invalid' && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Enlace no válido</AlertTitle>
                <AlertDescription>
                  {sessionError ?? 'No se pudo validar la sesión de recuperación.'}
                </AlertDescription>
              </Alert>
              <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 rounded-full">
                <Link to="/login" replace>
                  Ir al inicio de sesión
                </Link>
              </Button>
            </div>
          )}

          {sessionStatus === 'ready' && successMessage && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Contraseña actualizada</AlertTitle>
              <AlertDescription className="text-green-700">{successMessage}</AlertDescription>
            </Alert>
          )}

          {sessionStatus === 'ready' && !successMessage && (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nueva contraseña</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    required
                    minLength={MIN_PASSWORD_LENGTH}
                    disabled={loading}
                    aria-invalid={feedback.newPasswordError ? true : undefined}
                    className="rounded-lg pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    aria-label={showNewPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {feedback.newPasswordError && (
                  <p className="text-sm text-red-600">{feedback.newPasswordError}</p>
                )}
                {feedback.newPasswordSuccess && (
                  <p className="text-sm text-green-600">{feedback.newPasswordSuccess}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    minLength={MIN_PASSWORD_LENGTH}
                    disabled={loading}
                    aria-invalid={feedback.confirmError ? true : undefined}
                    className="rounded-lg pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    aria-label={
                      showConfirmPassword ? 'Ocultar confirmación' : 'Mostrar confirmación'
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {feedback.confirmError && (
                  <p className="text-sm text-red-600">{feedback.confirmError}</p>
                )}
                {feedback.confirmSuccess && (
                  <p className="text-sm text-green-600">{feedback.confirmSuccess}</p>
                )}
              </div>

              {formError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No se pudo actualizar</AlertTitle>
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={loading || !canSubmit}
                className="w-full bg-blue-600 hover:bg-blue-700 rounded-full"
              >
                {loading ? 'Actualizando contraseña...' : 'Actualizar contraseña'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
