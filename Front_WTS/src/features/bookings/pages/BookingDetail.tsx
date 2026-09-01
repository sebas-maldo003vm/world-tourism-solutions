import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { mockBookings } from '@/core/mocks/mockData';

export function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const bookings = mockBookings.filter(b => b.serviceId === id);

  if (bookings.length === 0) {
    return <p className="text-center py-10">No hay reservas</p>;
  }

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

        <h1 className="text-3xl font-bold mb-6">
          Reservas de {bookings[0].serviceName}
        </h1>

        <div className="border rounded-lg overflow-hidden bg-white">
          <table className="w-full text-sm">

            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Cliente</th>
                <th className="p-3">Correo</th>
                <th className="p-3">Fecha</th>
                <th className="p-3">Personas</th>
                <th className="p-3">Total</th>
                <th className="p-3">Estado</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {bookings.map(b => (
                <tr key={b.id} className="border-t hover:bg-gray-50">

                  <td className="p-3">{b.userName}</td>

                  <td className="p-3 text-center">{b.userEmail}</td>

                  <td className="p-3 text-center">{b.date}</td>

                  <td className="p-3 text-center">{b.people}</td>

                  <td className="p-3 text-center">${b.totalPrice}</td>

                  <td className="p-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      b.status === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : b.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {b.status}
                    </span>
                  </td>

                  {/* BOTONES */}
                  <td className="p-3 text-right flex gap-2 justify-end">

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate('/chat')}
                    >
                      Contactar
                    </Button>

                    {b.status === 'pending' && (
                      <>
                        <Button size="sm" className="bg-green-600">
                          Aceptar
                        </Button>

                        <Button size="sm" variant="destructive">
                          Rechazar
                        </Button>
                      </>
                    )}

                  </td>

                </tr>
              ))}
            </tbody>

          </table>
        </div>

      </div>
    </div>
  );
}