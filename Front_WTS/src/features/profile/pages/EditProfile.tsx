import { useState } from 'react';

import { Card, CardContent } from '@/shared/components/ui/card';

import { Button } from '@/shared/components/ui/button';

import { Input } from '@/shared/components/ui/input';

import { Label } from '@/shared/components/ui/label';

import { User } from 'lucide-react';

import { useNavigate } from 'react-router-dom';

interface UserData {
  id: number;
  name: string;
  email: string;
  phoneNumber?: string;
  role: 'USER' | 'PROVIDER' | 'ADMIN';
}

export function EditProfile() {

  const navigate = useNavigate();

  // USER STORAGE
  const storedUser = localStorage.getItem('user');

  const user: UserData | null = storedUser
    ? JSON.parse(storedUser)
    : null;

  // FORM
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    password: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {

    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    const updatedUser = {
      ...user,
      name: form.name,
      email: form.email,
      phoneNumber: form.phoneNumber,
    };

    // ACTUALIZAR LOCALSTORAGE
    localStorage.setItem(
      'user',
      JSON.stringify(updatedUser)
    );

    console.log('Datos actualizados:', updatedUser);

    alert('Perfil actualizado correctamente');

    navigate('/profile');

    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        <Card>

          <CardContent className="p-6">
<Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          ← Volver
        </Button>
            {/* Header */}
            {/* HEADER */}
            <div className="flex items-center gap-4 mb-6">

              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">

                <User className="h-8 w-8 text-white" />

              </div>

              <div>

                <h1 className="text-2xl font-bold">
                  Editar Perfil
                </h1>

                <p className="text-gray-600 text-sm">
                  Actualiza tu información personal
                </p>

              </div>

            </div>

            {/* FORM */}
            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              <div>

                <Label>
                  Nombre completo
                </Label>

                <Input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Tu nombre"
                />

              </div>

              <div>

                <Label>
                  Correo electrónico
                </Label>

                <Input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="correo@email.com"
                />

              </div>

              <div>

                <Label>
                  Teléfono
                </Label>

                <Input
                  name="phoneNumber"
                  value={form.phoneNumber}
                  onChange={handleChange}
                  placeholder="3001234567"
                />

              </div>

              <div>

                <Label>
                  Nueva contraseña
                </Label>

                <Input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="********"
                />

              </div>

              {/* BUTTONS */}
              <div className="flex justify-end gap-3 pt-4">

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/profile')}
                  className="rounded-full"
                >
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 rounded-full"
                >
                  Guardar cambios
                </Button>

              </div>

            </form>

          </CardContent>

        </Card>

      </div>

    </div>
  );
}