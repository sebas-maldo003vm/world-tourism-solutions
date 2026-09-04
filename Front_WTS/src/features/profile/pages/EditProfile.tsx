import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Camera, Lock, User } from 'lucide-react';

import { API_ORIGIN } from '@/core/api/client';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  profileService,
  type UserProfile,
} from '@/features/profile/services/profileService';

function resolvePictureUrl(url?: string | null) {
  if (!url) {
    return null;
  }
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `${API_ORIGIN}${url}`;
}

function syncLocalUser(profile: UserProfile) {
  const stored = localStorage.getItem('user');
  const previous = stored ? JSON.parse(stored) : {};
  localStorage.setItem(
    'user',
    JSON.stringify({
      ...previous,
      id: profile.id,
      name: profile.name,
      email: profile.email,
      phoneNumber: profile.phoneNumber,
      role: profile.role,
      profilePictureUrl: profile.profilePictureUrl ?? null,
    }),
  );
}

export function EditProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      try {
        const { data } = await profileService.getMyProfile();
        if (cancelled) {
          return;
        }

        setForm({
          name: data.name ?? '',
          email: data.email ?? '',
          phoneNumber: data.phoneNumber ?? '',
        });
        setProfilePictureUrl(data.profilePictureUrl ?? null);
        syncLocalUser(data);
      } catch {
        if (!cancelled) {
          toast.error('No se pudo cargar el perfil.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value,
    });
  };

  const handlePictureSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setUploading(true);
    try {
      const { data } = await profileService.uploadProfilePicture(file);
      setProfilePictureUrl(data.profilePictureUrl);

      const stored = localStorage.getItem('user');
      const previous = stored ? JSON.parse(stored) : {};
      localStorage.setItem(
        'user',
        JSON.stringify({
          ...previous,
          profilePictureUrl: data.profilePictureUrl,
        }),
      );

      toast.success('Foto de perfil actualizada.');
    } catch {
      toast.error('No se pudo subir la foto de perfil.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data } = await profileService.updateProfile({
        name: form.name.trim(),
        phoneNumber: form.phoneNumber.trim(),
      });

      setForm({
        name: data.name ?? '',
        email: data.email ?? '',
        phoneNumber: data.phoneNumber ?? '',
      });
      setProfilePictureUrl(data.profilePictureUrl ?? profilePictureUrl);
      syncLocalUser(data);

      toast.success('Perfil actualizado correctamente.');
      navigate('/profile');
    } catch {
      toast.error('No se pudo actualizar el perfil.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword.length < 8) {
      toast.error('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('La nueva contraseña y la confirmación no coinciden.');
      return;
    }

    setChangingPassword(true);
    try {
      await profileService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      toast.success('Contraseña actualizada correctamente.');
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          'No se pudo cambiar la contraseña. Verifica la contraseña actual.',
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const previewUrl = resolvePictureUrl(profilePictureUrl);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="p-6 text-sm text-gray-600">
              Cargando perfil...
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <Card>
          <CardContent className="p-6">
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
              ← Volver
            </Button>

            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Foto de perfil"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="h-8 w-8 text-white" />
                  )}
                </div>
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                  aria-label="Cambiar foto de perfil"
                >
                  <Camera className="h-4 w-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handlePictureSelect}
                />
              </div>

              <div>
                <h1 className="text-2xl font-bold">Editar Perfil</h1>
                <p className="text-gray-600 text-sm">
                  {uploading
                    ? 'Subiendo foto...'
                    : 'Actualiza tu información personal'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label>Nombre completo</Label>
                <Input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Tu nombre"
                  required
                />
              </div>

              <div>
                <Label>Correo electrónico</Label>
                <Input
                  name="email"
                  type="email"
                  value={form.email}
                  disabled
                  readOnly
                  placeholder="correo@email.com"
                />
              </div>

              <div>
                <Label>Teléfono</Label>
                <Input
                  name="phoneNumber"
                  value={form.phoneNumber}
                  onChange={handleChange}
                  placeholder="3001234567"
                  required
                />
              </div>

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
                  disabled={saving || uploading}
                  className="bg-blue-600 hover:bg-blue-700 rounded-full"
                >
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-3 mb-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Cambiar contraseña
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Usa una contraseña segura de al menos 8 caracteres.
                </p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              <div>
                <Label htmlFor="currentPassword">Contraseña actual</Label>
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <Label htmlFor="newPassword">Nueva contraseña</Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Mínimo 8 caracteres"
                  minLength={8}
                  required
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Repite la nueva contraseña"
                  minLength={8}
                  required
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={changingPassword}
                  className="bg-blue-600 hover:bg-blue-700 rounded-full"
                >
                  {changingPassword ? 'Actualizando...' : 'Actualizar contraseña'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
