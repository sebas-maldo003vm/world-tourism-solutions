import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';

import { Eye, EyeOff } from 'lucide-react';

import { api } from '@/core/api/client';
import { useAuth } from '@/features/auth/context/AuthContext';
import { goBackOnAuthLinkClick } from '@/features/auth/navigation';
import {
  toSpanishAuthError,
  type PublicAuthRole,
} from '@/features/auth/services/supabaseAuth';
import {
  INITIAL_LEGAL_CONSENT,
  isLegalConsentComplete,
  LEGAL_TEXT_VERSION,
  LegalConsentChecklist,
  type LegalConsentValue,
} from '@/shared/components/legal/LegalConsentChecklist';

export function Register() {

  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [showPassword, setShowPassword] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword
  ] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    role: 'USER',
  });

  const [loading, setLoading] =
    useState(false);

  const [consent, setConsent] =
    useState<LegalConsentValue>(INITIAL_LEGAL_CONSENT);

  const [consentError, setConsentError] =
    useState<string | null>(null);

  const consentComplete =
    isLegalConsentComplete(consent);

  const redirectByRole = (
    role: string
  ) => {

    switch (role) {

      case 'ADMIN':
      case 'SUPPORT':
        navigate('/admin', { replace: true });
        break;

      case 'PROVIDER':
        navigate('/dashboard-accesor', { replace: true });
        break;

      default:
        navigate('/home-logueado', { replace: true });
    }
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    if (!isLegalConsentComplete(consent)) {
      setConsentError(
        'Debes aceptar los términos y condiciones, autorizar el tratamiento de datos personales y confirmar que eres mayor de edad para continuar.'
      );
      return;
    }


    setConsentError(null);

    if (
      formData.password !==
      formData.confirmPassword
    ) {

      alert(
        'Las contraseñas no coinciden'
      );

      return;
    }

    try {

      setLoading(true);

      const role: PublicAuthRole =
        formData.role === 'PROVIDER' ? 'PROVIDER' : 'USER';

      const response = await api.post(
        '/auth/register',
        {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phoneNumber: formData.phoneNumber,
          role,
          consent: {
            termsAccepted: consent.termsAccepted === true,
            dataProcessingAccepted: consent.dataProcessingAccepted === true,
            adultConfirmed: consent.adultConfirmed === true,
            studyParticipationAccepted: consent.studyParticipationAccepted === true,
            documentVersion: LEGAL_TEXT_VERSION,
            acceptedAt: new Date().toISOString(),
          },
        }
      );

      const data = response.data;

      // TOKEN
      localStorage.setItem(
        'token',
        data.token
      );

      setUser(data.user);

      // REDIRECCION
      redirectByRole(
        data.user.role
      );

    } catch (error: any) {

      console.error(error);

      alert(
        error?.response?.data?.message ||
        (error?.response
          ? 'Error registrando usuario'
          : toSpanishAuthError(error))
      );

    } finally {

      setLoading(false);

    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) => {

    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-lg gap-0 rounded-2xl border-0 bg-white shadow-lg">
        <CardHeader className="gap-1 px-6 pt-5 pb-3">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-1 h-8 w-fit self-start px-2 text-sm"
          >
            ← Volver
          </Button>

          <CardTitle className="text-center text-2xl">
            Crear cuenta
          </CardTitle>

          <CardDescription className="text-center">
            Completa el formulario para registrarte
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 pt-1 pb-6">
          <form
            onSubmit={handleSubmit}
            className="space-y-3"
          >

            {/* NAME */}
            <div className="space-y-1">

              <Label htmlFor="name">
                Nombre completo
              </Label>

              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
                className="rounded-lg"
              />

            </div>

            {/* EMAIL */}
            <div className="space-y-1">

              <Label htmlFor="email">
                Correo
              </Label>

              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="rounded-lg"
              />

            </div>

            {/* PHONE */}
            <div className="space-y-1">

              <Label htmlFor="phoneNumber">
                Teléfono
              </Label>

              <Input
                id="phoneNumber"
                type="text"
                value={
                  formData.phoneNumber
                }
                onChange={handleChange}
                required
                className="rounded-lg"
              />

            </div>

            {/* PASSWORD */}
            <div className="space-y-1">

              <Label htmlFor="password">
                Contraseña
              </Label>

              <div className="relative">

                <Input
                  id="password"
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  value={
                    formData.password
                  }
                  onChange={handleChange}
                  required
                  className="rounded-lg pr-10"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >

                  {showPassword ? (

                    <EyeOff className="h-5 w-5" />

                  ) : (

                    <Eye className="h-5 w-5" />

                  )}

                </button>

              </div>

            </div>

            {/* CONFIRM PASSWORD */}
            <div className="space-y-1">

              <Label htmlFor="confirmPassword">
                Confirmar contraseña
              </Label>

              <div className="relative">

                <Input
                  id="confirmPassword"
                  type={
                    showConfirmPassword
                      ? 'text'
                      : 'password'
                  }
                  value={
                    formData.confirmPassword
                  }
                  onChange={handleChange}
                  required
                  className="rounded-lg pr-10"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >

                  {showConfirmPassword ? (

                    <EyeOff className="h-5 w-5" />

                  ) : (

                    <Eye className="h-5 w-5" />

                  )}

                </button>

              </div>

            </div>

            {/* ROLE */}
            <div className="space-y-1">

              <Label htmlFor="role">
                Rol
              </Label>

              <select
                id="role"
                value={formData.role}
                onChange={handleChange}
                className="h-9 w-full rounded-lg border bg-input-background px-3 text-sm"
              >

                <option value="USER">
                  Turista
                </option>

                <option value="PROVIDER">
                  Proveedor
                </option>

              </select>

            </div>
            <LegalConsentChecklist
              value={consent}
              onChange={(next) => {
                setConsent(next);
                if (isLegalConsentComplete(next)) {
                  setConsentError(null);
                }
              }}
              disabled={loading}
              idPrefix="register-consent"
              role={formData.role === 'PROVIDER' ? 'PROVIDER' : 'USER'}
            />

            {consentError && !consentComplete && (
              <p className="text-sm text-red-600" role="alert">
                {consentError}
              </p>
            )}

            {/* BUTTON */}
            {/*  <Button
              type="submit"
              disabled={loading}
              onClick={() => {
  if (!isLegalConsentComplete(consent)) {
    setConsentError(
      'Debes aceptar los términos y condiciones, autorizar el tratamiento de datos personales y confirmar que eres mayor de edad.'
    );
  }
}}
              className="w-full bg-blue-600 hover:bg-blue-700 rounded-full"
            > */}<Button
              type="submit"
              disabled={loading}
              onClick={() => {
                if (!isLegalConsentComplete(consent)) {
                  setConsentError(
                    'Debes aceptar los términos y condiciones, autorizar el tratamiento de datos personales y confirmar que eres mayor de edad.'
                  );
                }
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 rounded-full"
            >

              {loading
                ? 'Registrando...'
                : 'Registrarse'}

            </Button>

          </form>

          {/* FOOTER */}
          <div className="mt-3 text-center text-sm">

            <span className="text-gray-600">
              ¿Ya tienes cuenta?
            </span>

            <Link
              to="/login"
              replace
              onClick={(event) => goBackOnAuthLinkClick(event, navigate)}
              className="text-blue-600 hover:underline font-medium ml-1"
            >
              Iniciar sesión
            </Link>

          </div>

        </CardContent>

      </Card>

    </div>
  );
}