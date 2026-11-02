import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Mail } from 'lucide-react';

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
import {
  goBackOnAuthLinkClick,
  leaveAuthScreen,
} from '@/features/auth/navigation';
import {
  requestPasswordReset,
  toSpanishAuthError,
} from '@/features/auth/services/supabaseAuth';

export function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading || sent) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (resetError) {
      setError(toSpanishAuthError(resetError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="space-y-1">
          <Button
            variant="ghost"
            onClick={() => leaveAuthScreen(navigate, '/login')}
            className="mb-4"
          >
            ← Volver
          </Button>

          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Mail className="h-5 w-5" />
          </div>

          <CardTitle className="text-2xl text-center">Recuperar contraseña</CardTitle>
          <CardDescription className="text-center">
            Te enviaremos un enlace para elegir una nueva contraseña.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {sent ? (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50 text-green-800">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Revisa tu correo</AlertTitle>
                <AlertDescription className="text-green-700">
                  Si {email.trim()} está registrado, recibirás un enlace para restablecer la
                  contraseña. Ábrelo en este mismo navegador.
                </AlertDescription>
              </Alert>

              <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 rounded-full">
                <Link
                  to="/login"
                  replace
                  onClick={(event) => goBackOnAuthLinkClick(event, navigate)}
                >
                  Volver al inicio de sesión
                </Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  disabled={loading}
                  className="rounded-lg"
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No se pudo enviar el enlace</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 rounded-full"
              >
                {loading ? 'Enviando enlace...' : 'Enviar enlace de recuperación'}
              </Button>
            </form>
          )}

          {!sent && (
            <div className="mt-4 text-center text-sm">
              <Link
                to="/login"
                replace
                onClick={(event) => goBackOnAuthLinkClick(event, navigate)}
                className="text-blue-600 hover:underline font-medium"
              >
                Volver al inicio de sesión
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
