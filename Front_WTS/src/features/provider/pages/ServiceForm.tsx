import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';

import { MapPin, Plus, Trash2 } from 'lucide-react';

import { api, API_ORIGIN } from '@/core/api/client';
import { assertImageFile } from '@/core/storage/supabaseStorage.service';
import {
  providerBusinessApi,
  uploadServiceGallery,
} from '@/features/provider/services/providerBusinessApi';
import { ImageCarousel } from '@/shared/components/catalog/ImageCarousel';
import { LocationPicker } from '@/shared/components/catalog/LocationPicker'; // 🆕 Fase 3

interface ServiceData {
  businessName?: string;
  title?: string;
  nit?: string;
  description?: string;
  category?: string;
  price?: number | string;
  city?: string;
  location?: string;
  address?: string;
  latitude?: number | string;
  longitude?: number | string;
  imageUrl?: string;
  imageUrls?: string[];
  images?: string[];
  taxId?: string;
}

function resolveImageUrl(url: string) {
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
    return url;
  }

  return url.startsWith('/') ? `${API_ORIGIN}${url}` : url;
}

const getServiceImages = (service: ServiceData) => {
  if (service.imageUrls?.length) {
    return service.imageUrls;
  }

  if (service.images?.length) {
    return service.images;
  }

  return service.imageUrl ? [service.imageUrl] : [];
};

export function ServiceForm() {

  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const isEdit = !!id;
  const serviceFromState = (location.state as { service?: ServiceData } | null)
    ?.service;

  const [loading, setLoading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: '',
    nit: '',
    description: '',
    category: 'ACTIVIDAD',
    price: '',
    city: '',
    location: '',
    latitude: '',
    longitude: '',
  });
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [galleryTouched, setGalleryTouched] = useState(false);

  const imagePreviews = useMemo(
    () => images.map((image) => URL.createObjectURL(image)),
    [images]
  );

  const previewImages = useMemo(
    () => ([
      ...existingImages,
      ...imagePreviews,
    ]),
    [existingImages, imagePreviews]
  );

  useEffect(() => {
    return () => {
      imagePreviews.forEach((imagePreview) => {
        URL.revokeObjectURL(imagePreview);
      });
    };
  }, [imagePreviews]);

  const fillForm = (service: ServiceData) => {
    setForm({
      title: service.businessName || service.title || '',
      nit: service.nit || service.taxId || '',
      description: service.description || '',
      category: service.category || 'ACTIVIDAD',
      price: service.price != null ? String(service.price) : '',
      city: service.city || '',
      location: service.location || service.address || '',
      latitude: service.latitude != null ? String(service.latitude) : '',
      longitude: service.longitude != null ? String(service.longitude) : '',
    });

    setExistingImages(getServiceImages(service));
    setGalleryTouched(false);
  };

  useEffect(() => {
    if (!isEdit) {
      return;
    }

    if (serviceFromState) {
      fillForm(serviceFromState);
      return;
    }

    const loadService = async () => {
      try {
        setLoading(true);

        const response = await api.get(`/businesses/${id}`);
        fillForm(response.data);
      } catch (error) {
        console.error(error);
        alert('Error cargando servicio');
      } finally {
        setLoading(false);
      }
    };

    loadService();
  }, [id, isEdit, serviceFromState]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {

    const value =
      e.target.name === 'description'
        ? e.target.value.slice(0, 1000)
        : e.target.value;

    setForm({
      ...form,
      [e.target.name]: value,
    });
  };

  // 🆕 Fase 3: recibe lat/lng seleccionados en el LocationPicker
  const handleLocationChange = (lat: string, lng: string) => {
    setForm((currentForm) => ({
      ...currentForm,
      latitude: lat,
      longitude: lng,
    }));
  };

  const handleImageSelect = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedImages = Array.from(e.target.files || []);
    e.target.value = '';

    if (selectedImages.length === 0) {
      return;
    }

    try {
      selectedImages.forEach(assertImageFile);
    } catch (error: any) {
      alert(error?.message || 'Imagen no valida.');
      return;
    }

    if (existingImages.length + images.length + selectedImages.length > 10) {
      alert('No puedes adjuntar mas de 10 imagenes.');
      return;
    }

    setImages((currentImages) => [...currentImages, ...selectedImages]);
  };

  const removeImage = (index: number) => {
    setImages((currentImages) =>
      currentImages.filter((_, currentIndex) => currentIndex !== index)
    );
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((currentImages) =>
      currentImages.filter((_, currentIndex) => currentIndex !== index)
    );
    setGalleryTouched(true);
  };

  const handleSave = async () => {

    try {

      setLoading(true);

      const uploadedUrls = images.length
        ? await uploadServiceGallery(images)
        : [];
      const imageUrls = [...existingImages, ...uploadedUrls];
      const shouldPersistGallery = !isEdit || galleryTouched || uploadedUrls.length > 0;

      if (shouldPersistGallery && imageUrls.length === 0) {
        alert('Debes adjuntar al menos una imagen.');
        return;
      }

      const payload = {
        businessName: form.title,
        taxId: form.nit,
        description: form.description,
        category: form.category,
        price: String(Number(form.price)),
        city: form.city,
        location: form.location,
        latitude: form.latitude,
        longitude: form.longitude,
        ...(shouldPersistGallery ? { imageUrls } : {}),
      };

      if (isEdit && id) {
        await providerBusinessApi.update(id, payload);
      } else {
        await providerBusinessApi.create(payload);
      }

      alert(
        isEdit
          ? 'Servicio actualizado correctamente'
          : 'Servicio publicado correctamente'
      );

      navigate('/dashboard-accesor');

    } catch (error: any) {

      console.error(error);

      alert(
        error?.response?.data?.message ||
        error?.message ||
        'Error guardando servicio'
      );

    } finally {

      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">

      <div className="max-w-5xl mx-auto px-4">

        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          ← Volver
        </Button>

        <div className="grid lg:grid-cols-5 gap-6">

          {/* FORM */}
          <div className="lg:col-span-3 space-y-6">

            <Card>

              <CardContent className="p-6 space-y-4">

                <h2 className="text-xl font-semibold">
                  {isEdit
                    ? 'Editar servicio'
                    : 'Publicar servicio'}
                </h2>

                {/* TITULO */}
                <div>
                  <Label>Título</Label>

                  <Input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <Label>NIT (opcional)</Label>

                  <Input
                    name="nit"
                    value={form.nit}
                    onChange={handleChange}
                    placeholder="Ej: 900123456-7"
                  />
                </div>

                {/* CATEGORIA */}
                <div>

                  <Label>Categoría</Label>

                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="w-full border rounded-md p-2"
                  >

                    <option value="RESTAURANTE">
                      Restaurante
                    </option>

                    <option value="ACTIVIDAD">
                      Actividad
                    </option>

                    <option value="HOSPEDAJE">
                      Hospedaje
                    </option>

                    <option value="TRANSPORTE">
                      Transporte
                    </option>

                    <option value="TOUR">
                      Tour
                    </option>

                    <option value="OTRO">
                      Otro
                    </option>

                  </select>

                </div>

                {/* UBICACION */}
                <div>

                  <Label>Ciudad</Label>

                  <Input
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="Ej: Bogotá"
                  />

                </div>

                <div>

                  <Label>Ubicación</Label>

                  <Input
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                  />

                </div>

                {/* 🆕 Fase 3: SELECCIONAR UBICACIÓN EN EL MAPA */}
                <div>

                  <Label className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4" />
                    Ubicación exacta en el mapa
                  </Label>

                  <LocationPicker
                    latitude={form.latitude}
                    longitude={form.longitude}
                    onLocationChange={handleLocationChange}
                  />

                </div>

                {/* PRECIO */}
                <div>

                  <Label>Precio</Label>

                  <Input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                  />

                </div>

                {/* DESCRIPCION */}
                <div>

                  <Label>Descripción</Label>

                  <Textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    maxLength={1000}
                  />

                  <div className="mt-1 text-right text-xs text-gray-500">
                    {form.description.length}/1000
                  </div>

                </div>

                {/* IMAGEN */}
                <div>

                  <div className="flex items-center justify-between mb-2">
                    <Label>Imágenes</Label>

                    <div>
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        onChange={handleImageSelect}
                        className="hidden"
                      />

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => imageInputRef.current?.click()}
                        className="rounded-full"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Adjuntar
                      </Button>
                    </div>
                  </div>

                  {existingImages.length > 0 || images.length > 0 ? (
                    <div className="grid sm:grid-cols-2 gap-3">
                      {existingImages.map((image, index) => (
                        <div
                          key={`existing-${image}-${index}`}
                          className="relative overflow-hidden rounded-lg border bg-white"
                        >
                          <img
                            src={resolveImageUrl(image)}
                            alt={`Imagen ${index + 1}`}
                            className="h-32 w-full object-cover"
                          />

                          <div className="flex items-center justify-between gap-2 p-2">
                            <span className="truncate text-sm text-gray-600">
                              Imagen guardada
                            </span>

                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => removeExistingImage(index)}
                              className="h-8 w-8 shrink-0"
                              aria-label="Quitar imagen guardada"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}

                      {images.map((image, index) => (
                        <div
                          key={`${image.name}-${index}`}
                          className="relative overflow-hidden rounded-lg border bg-white"
                        >
                          <img
                            src={imagePreviews[index]}
                            alt={image.name}
                            className="h-32 w-full object-cover"
                          />

                          <div className="flex items-center justify-between gap-2 p-2">
                            <span className="truncate text-sm text-gray-600">
                              {image.name}
                            </span>

                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => removeImage(index)}
                              className="h-8 w-8 shrink-0"
                              aria-label="Quitar imagen"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                      <div
                        className="rounded-lg border border-dashed p-4 text-sm text-gray-500"
                      >
                        No hay imágenes adjuntas.
                      </div>
                  )}

                </div>

              </CardContent>

            </Card>

          </div>

          {/* PREVIEW */}
          <div className="lg:col-span-2">

            <Card className="sticky top-20">

              <ImageCarousel
                images={previewImages}
                alt={form.title || 'Imagen del servicio'}
                className="w-full h-64 rounded-t-lg"
              />

              <CardContent className="p-6 space-y-4">

                <h2 className="text-xl font-semibold">
                  {form.title || 'Nombre del servicio'}
                </h2>

                <div className="flex items-center gap-2 text-gray-600 text-sm">

                  <MapPin className="h-4 w-4" />

                  {[form.city, form.location].filter(Boolean).join(', ') ||
                    'Ciudad y ubicación'}

                </div>

                <div className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full inline-block">
                  {form.category}
                </div>

                <div className="text-2xl font-bold text-blue-600">
                  ${form.price || 0}
                </div>

                <Button
                  onClick={handleSave}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 rounded-full"
                >

                  {loading
                    ? 'Guardando...'
                    : isEdit
                    ? 'Guardar cambios'
                    : 'Publicar servicio'}

                </Button>

              </CardContent>

            </Card>

          </div>

        </div>

      </div>

    </div>
  );
}
