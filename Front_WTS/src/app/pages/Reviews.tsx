import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { Star } from 'lucide-react';
import { api } from '../Services/api';

interface ReviewData {
  id: number | string;
  rating: number;
  comment: string;
  date?: string;
  createdAt?: string;
  userName?: string;
  user?: {
    name?: string;
  };
}

const getReviewUserName = (review: ReviewData) => (
  review.userName || review.user?.name || 'Usuario'
);

const getReviewDate = (review: ReviewData) => (
  review.date || review.createdAt?.slice(0, 10) || 'Sin fecha'
);

const getReviewsFromResponse = (data: any): ReviewData[] => {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.content)) {
    return data.content;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return data ? [data] : [];
};

export function Reviews() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const serviceName = (location.state as { serviceName?: string } | null)
    ?.serviceName || 'servicio';

  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState('');
  const [saving, setSaving] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  const averageRating = useMemo(() => {
    if (reviews.length === 0) {
      return 0;
    }

    const total = reviews.reduce(
      (sum, review) => sum + Number(review.rating || 0),
      0
    );

    return total / reviews.length;
  }, [reviews]);

  const ratingSummary = useMemo(() => (
    [5, 4, 3, 2, 1].map((stars) => {
      const count = reviews.filter(
        (review) => Number(review.rating) === stars
      ).length;

      return {
        stars,
        percentage: reviews.length ? Math.round((count / reviews.length) * 100) : 0,
      };
    })
  ), [reviews]);

  const loadReviews = async () => {
    if (!id) {
      return;
    }

    try {
      setReviewsLoading(true);
      setReviewsError('');

      const response = await api.get(`/reviews/businesses/${id}`);

      setReviews(getReviewsFromResponse(response.data));
    } catch (error: any) {
      console.error(error);
      setReviews([]);
      setReviewsError(
        error?.response?.data?.message ||
        'No se pudieron cargar las resenas'
      );
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) {
      return;
    }

    if (rating === 0) {
      alert('Selecciona una calificacion');
      return;
    }

    try {
      setSaving(true);

      const response = await api.post('/reviews', {
        businessId: Number.isNaN(Number(id)) ? id : Number(id),
        rating,
        comment,
      });

      if (response.data) {
        setReviews((currentReviews) => [
          response.data,
          ...currentReviews,
        ]);
      } else {
        loadReviews();
      }

      alert('Resena publicada correctamente');
      setRating(0);
      setComment('');
    } catch (error: any) {
      console.error(error);

      alert(
        error?.response?.data?.message ||
        'Error publicando resena'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          Volver
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">
            Resenas de {serviceName}
          </h1>

          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            <span className="text-xl font-semibold">
              {averageRating.toFixed(1)}
            </span>
            <span className="text-gray-600">
              ({reviews.length} resenas)
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Escribe tu resena
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Tu calificacion
                    </label>

                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="transition-transform hover:scale-110"
                        >
                          <Star
                            className={`h-8 w-8 ${
                              star <= (hoverRating || rating)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="comment" className="block text-sm font-medium mb-2">
                      Tu comentario
                    </label>

                    <Textarea
                      id="comment"
                      placeholder="Comparte tu experiencia..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="min-h-32"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 rounded-full"
                    disabled={rating === 0 || saving}
                  >
                    {saving ? 'Publicando...' : 'Publicar resena'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Todas las resenas</h2>

              {reviewsLoading ? (
                <Card>
                  <CardContent className="p-6 text-center text-gray-600">
                    Cargando resenas...
                  </CardContent>
                </Card>
              ) : reviewsError ? (
                <Card>
                  <CardContent className="p-6 text-center text-gray-600">
                    {reviewsError}
                  </CardContent>
                </Card>
              ) : reviews.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-gray-600">
                    Aun no hay resenas para este servicio.
                  </CardContent>
                </Card>
              ) : reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-semibold">
                          {getReviewUserName(review)}
                        </div>

                        <div className="text-sm text-gray-600">
                          {getReviewDate(review)}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Number(review.rating)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-gray-700">{review.comment}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">
                  Resumen de calificaciones
                </h3>

                <div className="space-y-3">
                  {ratingSummary.map(({ stars, percentage }) => (
                    <div key={stars} className="flex items-center gap-2">
                      <span className="text-sm w-8">{stars}</span>

                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      <span className="text-sm text-gray-600 w-8 text-right">
                        {percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
