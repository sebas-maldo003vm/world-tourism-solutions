import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Label } from '@/shared/components/ui/label';
import { Input } from '@/shared/components/ui/input';
import { Calendar } from '@/shared/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { Calendar as CalendarIcon, MapPin, Star, Users, DollarSign, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { api } from '@/core/api/client';
import { ImageCarousel } from '@/shared/components/catalog/ImageCarousel';

interface Business {
  id: number;
  businessName: string;
  description: string;
  address?: string;
  city?: string;
  category?: string;
  logoUrl?: string;
  imageUrls?: string[];
  price?: number;
}

interface ReviewData {
  id: number | string;
  rating: number;
  comment: string;
  date?: string;
  createdAt?: string;
  userName?: string;
  user?: { name?: string };
}

const getReviewUserName = (review: ReviewData) =>
  review.userName || review.user?.name || 'Usuario';

const getReviewDate = (review: ReviewData) =>
  review.date || review.createdAt?.slice(0, 10) || 'Sin fecha';

const getReviewsFromResponse = (data: any): ReviewData[] => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data)) return data.data;
  return data ? [data] : [];
};

export function Booking() {
  const { id } = useParams();
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const isAuthenticated = !!token;

  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState('');
  const [date, setDate] = useState<Date>();
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [people, setPeople] = useState(1);

  useEffect(() => {
    loadBusiness();
    loadReviews();
  }, [id]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0);
    return total / reviews.length;
  }, [reviews]);

  const loadBusiness = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/businesses/${id}`);
      setBusiness(response.data);
    } catch (error) {
      console.error(error);
      alert('Error cargando servicio');
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    if (!id) return;
    try {
      setReviewsLoading(true);
      setReviewsError('');
      const response = await api.get(`/reviews/businesses/${id}`);
      setReviews(getReviewsFromResponse(response.data));
    } catch (error: any) {
      console.error(error);
      setReviews([]);
      setReviewsError(error?.response?.data?.message || 'No se pudieron cargar las reseñas');
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!isAuthenticated) {
      alert('Debes iniciar sesión');
      navigate('/login');
      return;
    }
    if (!date) {
      alert('Selecciona una fecha');
      return;
    }
    if (!business) return;

    try {
      setBookingLoading(true);
      const payload = {
        businessId: business.id,
        bookingDate: format(date, 'yyyy-MM-dd'),
        startTime: startTime || null,
        endTime: endTime || null,
        numPeople: people,
      };

      const response = await api.post('/bookings', payload);
      console.log('BOOKING:', response.data);
      alert('Reserva creada correctamente');
      navigate('/profile');
    } catch (error: any) {
      console.error(error);
      const message =
        error?.response?.data?.message ||
        error?.response?.data ||
        'Error creando reserva';
      alert(message);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg font-medium">
        Cargando...
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg font-medium">
        Servicio no encontrado
      </div>
    );
  }

  const total = Number(business.price || 0) * people;

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          ← Volver
        </Button>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* INFORMACIÓN */}
          <div className="lg:col-span-3 space-y-6">
            <Card className="overflow-hidden shadow-lg border-0">
              <ImageCarousel
                images={
                  business.imageUrls?.length
                    ? business.imageUrls
                    : [business.logoUrl || 'https://via.placeholder.com/500']
                }
                alt={business.businessName}
                className="w-full h-72"
              />
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{business.businessName}</h1>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4" />
                      {[business.city, business.address].filter(Boolean).join(', ') ||
                        'Sin ubicación'}
                    </div>
                  </div>
                  <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold">
                    {business.category}
                  </div>
                </div>
                <div className="mt-6">
                  <p className="text-gray-700 leading-relaxed text-[15px]">{business.description}</p>
                </div>
                <div className="mt-6 flex items-center gap-2 text-2xl font-bold text-green-600">
                  <DollarSign className="h-6 w-6" />
                  ${Number(business.price || 0).toLocaleString()}
                  <span className="text-sm text-gray-500 font-normal">por persona</span>
                </div>
              </CardContent>
            </Card>

            {/* RESEÑAS — igual que antes, sin cambios */}
            <Card className="shadow-lg border-0">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold">Reseñas</h2>
                    <p className="text-sm text-gray-600">Opiniones de otros viajeros</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{averageRating.toFixed(1)}</span>
                    <span className="text-sm text-gray-600">({reviews.length})</span>
                  </div>
                </div>
                {reviewsLoading ? (
                  <p className="text-sm text-gray-600">Cargando reseñas...</p>
                ) : reviewsError ? (
                  <p className="text-sm text-gray-600">{reviewsError}</p>
                ) : reviews.length === 0 ? (
                  <p className="text-sm text-gray-600">
                    Aún no hay reseñas para este servicio.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div
                        key={review.id}
                        className="border-t pt-4 first:border-t-0 first:pt-0"
                      >
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">{getReviewUserName(review)}</p>
                            <p className="text-xs text-gray-500">{getReviewDate(review)}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, index) => (
                              <Star
                                key={index}
                                className={`h-4 w-4 ${
                                  index < Number(review.rating)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-gray-700">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* RESERVA */}
          <div className="lg:col-span-2">
            <Card className="sticky top-20 shadow-lg border-0">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-6">Reservar</h2>
                <div className="space-y-5">

                  {/* FECHA */}
                  <div>
                    <Label className="font-semibold">Fecha</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal mt-2 h-12"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, 'PPP', { locale: es }) : 'Seleccionar fecha'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          disabled={(currentDate) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            return currentDate < today;
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* HORA INICIO */}
                  <div>
                    <Label className="font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Hora de inicio
                    </Label>
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="mt-2 h-12"
                    />
                  </div>

                  {/* HORA FIN */}
                  <div>
                    <Label className="font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Hora de fin
                    </Label>
                    <Input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="mt-2 h-12"
                    />
                  </div>

                  {/* PERSONAS */}
                  <div>
                    <Label className="font-semibold">Número de personas</Label>
                    <div className="flex items-center gap-3 mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setPeople(Math.max(1, people - 1))}
                      >
                        -
                      </Button>
                      <div className="flex items-center gap-2 flex-1 justify-center border rounded-md h-10">
                        <Users className="h-4 w-4 text-gray-600" />
                        <span className="font-semibold">{people}</span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setPeople(people + 1)}
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  {/* RESUMEN */}
                  <div className="bg-gray-100 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Precio por persona</span>
                      <span>${Number(business.price || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Personas</span>
                      <span>{people}</span>
                    </div>
                    {startTime && endTime && (
                      <div className="flex justify-between text-sm">
                        <span>Horario</span>
                        <span>{startTime} – {endTime}</span>
                      </div>
                    )}
                    <div className="border-t pt-3 flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-green-600">${total.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* BOTÓN */}
                  <Button
                    onClick={handleConfirm}
                    disabled={!date || bookingLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 rounded-full h-12 text-base"
                  >
                    {!isAuthenticated
                      ? 'Inicia sesión para reservar'
                      : bookingLoading
                      ? 'Procesando...'
                      : 'Confirmar reserva'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}