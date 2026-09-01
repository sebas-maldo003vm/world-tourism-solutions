import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { Badge } from '@/shared/components/ui/badge';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import {
  adminApi,
  type AdminStats,
  type AdminTourService,
  type AdminUser,
  type ServiceStatus,
  type UserRole,
} from '@/features/admin/services/adminApi';
import { chatApi, type SupportTicket, type SupportStatus } from '@/features/chat/services/chatApi';
import { API_ORIGIN } from '@/core/api/client';
import { Search, Trash2, Loader2, AlertCircle } from 'lucide-react';

const ROLE_LABELS: Record<UserRole, string> = {
  USER: 'Usuario',
  PROVIDER: 'Asesor',
  ADMIN: 'Admin',
};

const STATUS_LABELS: Record<ServiceStatus, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
  INACTIVE: 'Inactivo',
};

function resolveImageUrl(image?: string) {
  if (!image) return 'https://placehold.co/96x96?text=Sin+imagen';
  if (image.startsWith('http')) return image;
  return `${API_ORIGIN}${image}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function statusBadgeVariant(status: ServiceStatus) {
  switch (status) {
    case 'APPROVED':
      return 'default' as const;
    case 'PENDING':
      return 'secondary' as const;
    case 'REJECTED':
      return 'destructive' as const;
    default:
      return 'outline' as const;
  }
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [services, setServices] = useState<AdminTourService[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<
    { type: 'user' | 'service'; id: number; label: string } | null
  >(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [statsRes, usersRes, servicesRes, supportRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.listUsers(),
        adminApi.listServices(),
        chatApi.listSupportTickets(),
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data);
      setServices(servicesRes.data);
      setSupportTickets(supportRes.data);
    } catch {
      setError('No se pudieron cargar los datos del panel de administración.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!token || !storedUser) {
      navigate('/login', { replace: true });
      return;
    }

    const parsedUser = JSON.parse(storedUser) as { role?: string };
    if (parsedUser.role !== 'ADMIN') {
      navigate('/', { replace: true });
      return;
    }

    loadData();
  }, [loadData, navigate]);

  const filteredServices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return services;

    return services.filter(
      (service) =>
        service.title.toLowerCase().includes(query) ||
        service.category.toLowerCase().includes(query) ||
        service.location?.toLowerCase().includes(query) ||
        service.providerBusinessName.toLowerCase().includes(query)
    );
  }, [searchQuery, services]);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return users;

    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        ROLE_LABELS[user.role].toLowerCase().includes(query)
    );
  }, [searchQuery, users]);

  const handleSupportStatusChange = async (ticketId: number, status: SupportStatus) => {
    setActionLoading(ticketId);
    try {
      const { data } = await chatApi.updateSupportStatus(ticketId, status);
      setSupportTickets((prev) => prev.map((t) => (t.id === ticketId ? data : t)));
      showFeedback('Estado del ticket actualizado.');
    } catch {
      showFeedback('No se pudo actualizar el ticket de soporte.', true);
    } finally {
      setActionLoading(null);
    }
  };

  const handleContactSupport = (ticketId: number) => {
    navigate(`/chat?conversation=${ticketId}`);
  };

  const showFeedback = (message: string, isError = false) => {
    if (isError) {
      setSuccess(null);
      setError(message);
    } else {
      setError(null);
      setSuccess(message);
    }
  };

  const handleUserRoleChange = async (userId: number, role: UserRole) => {
    setActionLoading(userId);
    try {
      const { data } = await adminApi.updateUser(userId, { role });
      setUsers((prev) => prev.map((user) => (user.id === userId ? data : user)));
      showFeedback('Rol actualizado correctamente.');
    } catch {
      showFeedback('No se pudo actualizar el rol del usuario.', true);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUserStatusToggle = async (user: AdminUser) => {
    setActionLoading(user.id);
    try {
      const { data } = await adminApi.updateUser(user.id, { isActive: !user.isActive });
      setUsers((prev) => prev.map((item) => (item.id === user.id ? data : item)));
      showFeedback(data.isActive ? 'Usuario activado.' : 'Usuario desactivado.');
    } catch {
      showFeedback('No se pudo cambiar el estado del usuario.', true);
    } finally {
      setActionLoading(null);
    }
  };

  const handleServiceStatusChange = async (serviceId: number, status: ServiceStatus) => {
    setActionLoading(serviceId);
    try {
      const { data } = await adminApi.updateServiceStatus(serviceId, { status });
      setServices((prev) => prev.map((service) => (service.id === serviceId ? data : service)));
      showFeedback('Estado del servicio actualizado.');
    } catch {
      showFeedback('No se pudo actualizar el estado del servicio.', true);
    } finally {
      setActionLoading(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setActionLoading(deleteTarget.id);
    try {
      if (deleteTarget.type === 'user') {
        await adminApi.deleteUser(deleteTarget.id);
        setUsers((prev) => prev.filter((user) => user.id !== deleteTarget.id));
        if (stats) {
          setStats({ ...stats, totalUsers: stats.totalUsers - 1 });
        }
      } else {
        await adminApi.deleteService(deleteTarget.id);
        setServices((prev) => prev.filter((service) => service.id !== deleteTarget.id));
        if (stats) {
          setStats({ ...stats, totalServices: stats.totalServices - 1 });
        }
      }

      showFeedback('Registro eliminado correctamente.');
      setDeleteTarget(null);
    } catch {
      showFeedback('No se pudo eliminar el registro.', true);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Cargando panel de administración...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Panel de Administración</h1>
          <p className="text-gray-600">Gestiona servicios, usuarios y soporte</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 border-green-200 bg-green-50 text-green-800">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600">Total Servicios</p>
              <p className="text-3xl font-bold">{stats?.totalServices ?? 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600">Servicios Pendientes</p>
              <p className="text-3xl font-bold">{stats?.pendingServices ?? 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600">Usuarios</p>
              <p className="text-3xl font-bold">{stats?.totalUsers ?? 0}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-6">
            <Tabs defaultValue="content" className="space-y-6">
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="content">Gestión de Servicios</TabsTrigger>
                  <TabsTrigger value="support">Soporte</TabsTrigger>
                  <TabsTrigger value="users">Gestión de Usuarios</TabsTrigger>
                </TabsList>

                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 rounded-full"
                  />
                </div>
              </div>

              <TabsContent value="content" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Servicios</h3>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Servicio</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {filteredServices.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                            No hay servicios para mostrar.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredServices.map((service) => (
                          <TableRow key={service.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <img
                                  src={resolveImageUrl(service.imageUrl)}
                                  alt={service.title}
                                  className="w-12 h-12 object-cover rounded"
                                />
                                <div>
                                  <div className="font-medium">{service.title}</div>
                                  <div className="text-sm text-gray-600">
                                    {service.location || service.providerBusinessName}
                                  </div>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell>{service.category}</TableCell>
                            <TableCell>${service.price}</TableCell>
                            <TableCell>{service.avgRating} ⭐</TableCell>

                            <TableCell>
                              <Badge variant={statusBadgeVariant(service.status)}>
                                {STATUS_LABELS[service.status]}
                              </Badge>
                            </TableCell>

                            <TableCell>
                              <div className="flex justify-end items-center gap-2">
                                <Select
                                  value={service.status}
                                  onValueChange={(value) =>
                                    handleServiceStatusChange(service.id, value as ServiceStatus)
                                  }
                                  disabled={actionLoading === service.id}
                                >
                                  <SelectTrigger className="w-36">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="PENDING">Pendiente</SelectItem>
                                    <SelectItem value="APPROVED">Aprobado</SelectItem>
                                    <SelectItem value="REJECTED">Rechazado</SelectItem>
                                    <SelectItem value="INACTIVE">Inactivo</SelectItem>
                                  </SelectContent>
                                </Select>

                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600"
                                  disabled={actionLoading === service.id}
                                  onClick={() =>
                                    setDeleteTarget({
                                      type: 'service',
                                      id: service.id,
                                      label: service.title,
                                    })
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="support" className="space-y-4">
                <h3 className="text-lg font-semibold">Soporte</h3>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Servicio</TableHead>
                        <TableHead>Urgencia</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {supportTickets.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                            No hay tickets de soporte registrados.
                          </TableCell>
                        </TableRow>
                      ) : (
                        supportTickets.map((ticket) => (
                          <TableRow key={ticket.id}>
                            <TableCell>#{ticket.id}</TableCell>
                            <TableCell>{ticket.userName}</TableCell>
                            <TableCell>{ticket.serviceName}</TableCell>

                            <TableCell>
                              <Badge
                                variant={
                                  ticket.urgency === 'HIGH'
                                    ? 'destructive'
                                    : ticket.urgency === 'MEDIUM'
                                      ? 'secondary'
                                      : 'default'
                                }
                              >
                                {ticket.urgency === 'HIGH'
                                  ? 'Alta'
                                  : ticket.urgency === 'MEDIUM'
                                    ? 'Media'
                                    : 'Baja'}
                              </Badge>
                            </TableCell>

                            <TableCell>{formatDate(ticket.createdAt)}</TableCell>

                            <TableCell>
                              <div className="flex justify-end gap-2">
                                <Select
                                  value={ticket.status}
                                  onValueChange={(value) =>
                                    handleSupportStatusChange(ticket.id, value as SupportStatus)
                                  }
                                  disabled={actionLoading === ticket.id}
                                >
                                  <SelectTrigger className="w-36">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="OPEN">Abierto</SelectItem>
                                    <SelectItem value="IN_PROGRESS">En progreso</SelectItem>
                                    <SelectItem value="RESOLVED">Resuelto</SelectItem>
                                    <SelectItem value="CLOSED">Cerrado</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="bg-blue-600 hover:bg-blue-700 rounded-full text-white"
                                  onClick={() => handleContactSupport(ticket.id)}
                                >
                                  Contactar
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="users" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Usuarios</h3>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Fecha registro</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                            No hay usuarios para mostrar.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Select
                                value={user.role}
                                onValueChange={(value) =>
                                  handleUserRoleChange(user.id, value as UserRole)
                                }
                                disabled={actionLoading === user.id}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="USER">Usuario</SelectItem>
                                  <SelectItem value="PROVIDER">Asesor</SelectItem>
                                  <SelectItem value="ADMIN">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>{formatDate(user.createdAt)}</TableCell>
                            <TableCell>
                              <Badge variant={user.isActive ? 'default' : 'secondary'}>
                                {user.isActive ? 'Activo' : 'Inactivo'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={actionLoading === user.id}
                                  onClick={() => handleUserStatusToggle(user)}
                                >
                                  {user.isActive ? 'Desactivar' : 'Activar'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600 hover:text-red-700"
                                  disabled={actionLoading === user.id}
                                  onClick={() =>
                                    setDeleteTarget({
                                      type: 'user',
                                      id: user.id,
                                      label: user.name,
                                    })
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Seguro que deseas eliminar &quot;{deleteTarget?.label}&quot;? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={confirmDelete}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
