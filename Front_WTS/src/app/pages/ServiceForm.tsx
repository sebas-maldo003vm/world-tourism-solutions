import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';

import { MapPin, Plus, Trash2 } from 'lucide-react';

import { api } from '../Services/api';
import { ImageCarousel } from '../components/ImageCarousel';

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
      nit: service.nit || '',
      description: service.description || '',
      category: service.category || 'ACTIVIDAD',
      price: service.price != null ? String(service.price) : '',
      city: service.city || '',
      location: service.location || service.address || '',
      latitude: service.latitude != null ? String(service.latitude) : '',
      longitude: service.longitude != null ? String(service.longitude) : '',
    });

    setExistingImages(getServiceImages(service));
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

  const handleImageSelect = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedImages = Array.from(e.target.files || []);

    setImages((currentImages) => ([
      ...currentImages,
      ...selectedImages,
    ]));

    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages((currentImages) =>
      currentImages.filter((_, currentIndex) => currentIndex !== index)
    );
  };

  const handleSave = async () => {

    try {

      setLoading(true);

      const token = localStorage.getItem('token');
      const payload = new FormData();

      payload.append('businessName', form.title);
      payload.append('nit', form.nit);
      payload.append('description', form.description);
      payload.append('category', form.category);
      payload.append('price', String(Number(form.price)));
      payload.append('city', form.city);
      payload.append('location', form.location);
      payload.append('latitude', form.latitude);
      payload.append('longitude', form.longitude);

      images.forEach((image) => {
        payload.append('images', image);
      });

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      if (isEdit) {

        await api.put(
          `/provider/business/${id}`,
          payload,
          {
            headers,
          }
        );

      } else {

        await api.post(
          '/provider/business',
          payload,
          {
            headers,
          }
        );
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
                        accept="image/*"
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

                  {images.length > 0 ? (
                    <div className="grid sm:grid-cols-2 gap-3">
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
