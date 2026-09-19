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

  const redirectByRole = (
    role: string
  ) => {

    switch (role) {

      case 'ADMIN':
      case 'SUPPORT':
        navigate('/admin',{ replace: true });
        break;

      case 'PROVIDER':
        navigate('/dashboard-accesor',{ replace: true });
        break;

      default:
        navigate('/home-logueado',{ replace: true });
    }
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

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

      const response = await api.post(
        '/auth/register',
        {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phoneNumber:
            formData.phoneNumber,
          role: formData.role,
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
        'Error registrando usuario'
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

    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">

      <Card className="w-full max-w-md shadow-lg border-0">

        {/* BOTON VOLVER */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          ← Volver
        </Button>

        {/* HEADER */}
        <CardHeader className="space-y-1">

          <CardTitle className="text-2xl text-center">
            Crear cuenta
          </CardTitle>

          <CardDescription className="text-center">
            Completa el formulario
            para registrarte
          </CardDescription>

        </CardHeader>

        <CardContent>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >

            {/* NAME */}
            <div className="space-y-2">

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
            <div className="space-y-2">

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
            <div className="space-y-2">

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
            <div className="space-y-2">

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
            <div className="space-y-2">

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
            <div className="space-y-2">

              <Label htmlFor="role">
                Rol
              </Label>

              <select
                id="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full border rounded-lg p-2 h-10"
              >

                <option value="USER">
                  Turista
                </option>

                <option value="PROVIDER">
                  Proveedor
                </option>

              </select>

            </div>

            {/* BUTTON */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 rounded-full"
            >

              {loading
                ? 'Registrando...'
                : 'Registrarse'}

            </Button>

          </form>

          {/* FOOTER */}
          <div className="mt-4 text-center text-sm">

            <span className="text-gray-600">
              ¿Ya tienes cuenta?
            </span>

            <Link
              to="/login"
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