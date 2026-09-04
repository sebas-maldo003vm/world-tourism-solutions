import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
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
  type AdminBusiness,
  type AdminServiceRow,
  type AdminStats,
  type AdminUser,
  type ServiceStatus,
  type UserRole,
} from '@/features/admin/services/adminApi';
import { chatApi, type SupportTicket, type SupportStatus } from '@/features/chat/services/chatApi';
import { API_ORIGIN } from '@/core/api/client';
import { Search, Trash2, Loader2, AlertCircle, CheckCircle2, Ban } from 'lucide-react';

const ROLE_LABELS: Record<UserRole, string> = {
  USER: 'Usuario',
  PROVIDER: 'Asesor',
  ADMIN: 'Admin',
  SUPPORT: 'Soporte',
  BOT: 'Bot',
};

/** Labels UI: APPROVED=activo, INACTIVE=inactivo, REJECTED=suspendido. */
const STATUS_LABELS: Record<ServiceStatus, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Activo',
  REJECTED: 'Suspendido',
  INACTIVE: 'Inactivo',
};

function mapBusinessToServiceRow(business: AdminBusiness): AdminServiceRow {
  return {
    id: business.id,
    title: business.businessName,
    description: business.description ?? '',
    category: business.category ?? 'N/A',
    price: Number(business.price) || 0,
    location: business.city ?? business.address,
    imageUrl: business.imageUrls?.[0] ?? business.logoUrl,
    avgRating: business.avgRating ?? 0,
    totalReviews: business.totalReviews ?? 0,
    status: business.status,
    createdAt: new Date().toISOString(),
    providerBusinessName: business.providerName,
  };
}

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
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [services, setServices] = useState<AdminServiceRow[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [activeTickets, setActiveTickets] = useState<SupportTicket[]>([]);
  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});
  const knownActiveIdsRef = useRef<number[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<
    { type: 'user' | 'service'; id: number; label: string } | null
  >(null);
  const [isSupportOnly, setIsSupportOnly] = useState(false);
  const canManageCritical = !isSupportOnly;

  const loadActiveTickets = useCallback(async (notifyNew = false) => {
    try {
      const { data } = await chatApi.listActiveTickets();
      setActiveTickets(data);
      if (notifyNew) {
        const newcomers = data.filter((ticket) => !knownActiveIdsRef.current.includes(ticket.id));
        newcomers.forEach((ticket) => {
          toast.info('Nuevo ticket que requiere soporte humano', {
            description: `${ticket.userName}: ${ticket.message.slice(0, 100)}`,
          });
        });
      }
      knownActiveIdsRef.current = data.map((ticket) => ticket.id);
    } catch {
      // El panel sigue operativo con el listado general de soporte
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [statsResult, usersResult, businessesResult, supportResult] =
      await Promise.allSettled([
        adminApi.getStats(),
        adminApi.listUsers(),
        adminApi.listBusinesses(),
        chatApi.listSupportTickets(),
      ]);

    if (statsResult.status === 'fulfilled') {
      setStats(statsResult.value.data);
    }

    if (usersResult.status === 'fulfilled') {
      setUsers(usersResult.value.data);
    }

    if (businessesResult.status === 'fulfilled') {
      setServices(businessesResult.value.data.map(mapBusinessToServiceRow));
    } else {
      setError('No se pudieron cargar los negocios.');
      toast.error('No se pudieron cargar los negocios.');
    }

    if (supportResult.status === 'fulfilled') {
      setSupportTickets(supportResult.value.data);
    }

    await loadActiveTickets(false);

    if (
      statsResult.status === 'rejected' &&
      usersResult.status === 'rejected' &&
      businessesResult.status === 'rejected'
    ) {
      setError('No se pudieron cargar los datos del panel de administración.');
      toast.error('No se pudieron cargar los datos del panel de administración.');
    }

    setLoading(false);
  }, [loadActiveTickets]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!token || !storedUser) {
      navigate('/login', { replace: true });
      return;
    }

    const parsedUser = JSON.parse(storedUser) as { role?: string };
    if (parsedUser.role !== 'ADMIN' && parsedUser.role !== 'SUPPORT') {
      navigate('/home-logueado', { replace: true });
      return;
    }

    setIsSupportOnly(parsedUser.role === 'SUPPORT');
    loadData();
  }, [loadData, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadActiveTickets(true);
    }, 8000);
    return () => clearInterval(interval);
  }, [loadActiveTickets]);

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
      setActiveTickets((prev) =>
        status === 'NEEDS_HUMAN_SUPPORT'
          ? prev.some((t) => t.id === ticketId)
            ? prev.map((t) => (t.id === ticketId ? data : t))
            : [...prev, data]
          : prev.filter((t) => t.id !== ticketId),
      );
      toast.success('Estado del ticket actualizado.');
    } catch {
      toast.error('No se pudo actualizar el ticket de soporte.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleContactSupport = (ticketId: number) => {
    navigate(`/chat?conversation=${ticketId}`);
  };

  const handleReplyActiveTicket = async (ticketId: number) => {
    const content = (replyDrafts[ticketId] || '').trim();
    if (!content) return;
    setActionLoading(ticketId);
    try {
      await chatApi.replyActiveTicket(ticketId, content);
      setReplyDrafts((prev) => ({ ...prev, [ticketId]: '' }));
      setActiveTickets((prev) => prev.filter((t) => t.id !== ticketId));
      setSupportTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId ? { ...t, status: 'IN_PROGRESS' as SupportStatus } : t,
        ),
      );
      toast.success('Respuesta enviada al usuario.');
    } catch {
      toast.error('No se pudo responder el ticket.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUserRoleChange = async (userId: number, role: UserRole) => {
    setActionLoading(userId);
    try {
      const { data } = await adminApi.updateUser(userId, { role });
      setUsers((prev) => prev.map((user) => (user.id === userId ? data : user)));
      toast.success('Rol actualizado correctamente.');
    } catch {
      toast.error('No se pudo actualizar el rol del usuario.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUserStatusToggle = async (user: AdminUser) => {
    setActionLoading(user.id);
    try {
      const { data } = await adminApi.updateUser(user.id, { isActive: !user.isActive });
      setUsers((prev) => prev.map((item) => (item.id === user.id ? data : item)));
      toast.success(data.isActive ? 'Usuario activado.' : 'Usuario desactivado.');
    } catch {
      toast.error('No se pudo cambiar el estado del usuario.');
    } finally {
      setActionLoading(null);
    }
  };

  const refreshPendingBusinesses = (previous: ServiceStatus, next: ServiceStatus) => {
    if (!stats) return;
    let pendingBusinesses = stats.pendingBusinesses;
    if (previous === 'PENDING' && next !== 'PENDING') pendingBusinesses -= 1;
    if (previous !== 'PENDING' && next === 'PENDING') pendingBusinesses += 1;
    setStats({ ...stats, pendingBusinesses: Math.max(0, pendingBusinesses) });
  };

  const handleServiceStatusChange = async (serviceId: number, status: ServiceStatus) => {
    const current = services.find((service) => service.id === serviceId);
    if (!current) return;

    setActionLoading(serviceId);
    try {
      const { data } = await adminApi.updateBusinessStatus(serviceId, { status });
      setServices((prev) =>
        prev.map((service) =>
          service.id === serviceId ? mapBusinessToServiceRow(data) : service
        )
      );
      refreshPendingBusinesses(current.status, data.status);
      toast.success(`Estado del negocio actualizado a ${STATUS_LABELS[data.status]}.`);
    } catch {
      toast.error('No se pudo actualizar el estado del negocio.');
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
          setStats({ ...stats, totalUsers: Math.max(0, stats.totalUsers - 1) });
        }
        toast.success('Usuario eliminado correctamente.');
      } else {
        const removed = services.find((service) => service.id === deleteTarget.id);
        await adminApi.deleteBusiness(deleteTarget.id);
        setServices((prev) => prev.filter((service) => service.id !== deleteTarget.id));
        if (stats) {
          setStats({
            ...stats,
            totalBusinesses: Math.max(0, stats.totalBusinesses - 1),
            pendingBusinesses:
              removed?.status === 'PENDING'
                ? Math.max(0, stats.pendingBusinesses - 1)
                : stats.pendingBusinesses,
          });
        }
        toast.success('Negocio eliminado correctamente.');
      }

      setDeleteTarget(null);
    } catch {
      toast.error('No se pudo eliminar el registro.');
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
          <h1 className="text-3xl font-bold mb-2">
            {isSupportOnly ? 'Panel de Soporte' : 'Panel de Administración'}
          </h1>
          <p className="text-gray-600">
            {isSupportOnly
              ? 'Consulta servicios y usuarios, gestiona estados y atiende tickets'
              : 'Gestiona servicios, usuarios y soporte'}
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600">Total Negocios</p>
              <p className="text-3xl font-bold">{stats?.totalBusinesses ?? 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600">Negocios Pendientes</p>
              <p className="text-3xl font-bold">{stats?.pendingBusinesses ?? 0}</p>
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
                  <TabsTrigger value="support">
                    Tickets de Soporte
                    {activeTickets.length > 0 && (
                      <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-[10px] text-white">
                        {activeTickets.length}
                      </span>
                    )}
                  </TabsTrigger>
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
                                {service.status !== 'APPROVED' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-green-700 border-green-200 hover:bg-green-50"
                                    disabled={actionLoading === service.id}
                                    onClick={() =>
                                      handleServiceStatusChange(service.id, 'APPROVED')
                                    }
                                  >
                                    <CheckCircle2 className="h-4 w-4 mr-1" />
                                    Aprobar
                                  </Button>
                                )}

                                {service.status !== 'INACTIVE' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={actionLoading === service.id}
                                    onClick={() =>
                                      handleServiceStatusChange(service.id, 'INACTIVE')
                                    }
                                  >
                                    <Ban className="h-4 w-4 mr-1" />
                                    Desactivar
                                  </Button>
                                )}

                                {service.status !== 'REJECTED' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-amber-700 border-amber-200 hover:bg-amber-50"
                                    disabled={actionLoading === service.id}
                                    onClick={() =>
                                      handleServiceStatusChange(service.id, 'REJECTED')
                                    }
                                  >
                                    Suspender
                                  </Button>
                                )}

                                {canManageCritical && (
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
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="support" className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Requieren intervención humana</h3>
                    <Badge variant="destructive">{activeTickets.length} activos</Badge>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Usuario</TableHead>
                          <TableHead>Asunto</TableHead>
                          <TableHead>Último mensaje</TableHead>
                          <TableHead>Responder</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeTickets.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                              No hay conversaciones escaladas por el chatbot.
                            </TableCell>
                          </TableRow>
                        ) : (
                          activeTickets.map((ticket) => (
                            <TableRow key={`active-${ticket.id}`}>
                              <TableCell>#{ticket.id}</TableCell>
                              <TableCell>{ticket.userName}</TableCell>
                              <TableCell>{ticket.subject}</TableCell>
                              <TableCell className="max-w-xs truncate">{ticket.message}</TableCell>
                              <TableCell>
                                <div className="flex min-w-[260px] gap-2">
                                  <Input
                                    placeholder="Respuesta al usuario..."
                                    value={replyDrafts[ticket.id] || ''}
                                    onChange={(e) =>
                                      setReplyDrafts((prev) => ({
                                        ...prev,
                                        [ticket.id]: e.target.value,
                                      }))
                                    }
                                  />
                                  <Button
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700"
                                    disabled={
                                      actionLoading === ticket.id ||
                                      !(replyDrafts[ticket.id] || '').trim()
                                    }
                                    onClick={() => handleReplyActiveTicket(ticket.id)}
                                  >
                                    Enviar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleContactSupport(ticket.id)}
                                  >
                                    Abrir
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Todos los tickets</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Usuario</TableHead>
                          <TableHead>Servicio</TableHead>
                          <TableHead>Urgencia</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {supportTickets.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                              No hay tickets de soporte registrados.
                            </TableCell>
                          </TableRow>
                        ) : (
                          supportTickets.map((ticket) => (
                            <TableRow key={ticket.id}>
                              <TableCell>#{ticket.id}</TableCell>
                              <TableCell>{ticket.userName}</TableCell>
                              <TableCell>{ticket.subject}</TableCell>

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

                              <TableCell>
                                <Badge
                                  variant={
                                    ticket.status === 'NEEDS_HUMAN_SUPPORT'
                                      ? 'destructive'
                                      : 'outline'
                                  }
                                >
                                  {ticket.status === 'NEEDS_HUMAN_SUPPORT'
                                    ? 'Necesita humano'
                                    : ticket.status}
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
                                    <SelectTrigger className="w-44">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="OPEN">Abierto</SelectItem>
                                      <SelectItem value="IN_PROGRESS">En progreso</SelectItem>
                                      <SelectItem value="NEEDS_HUMAN_SUPPORT">
                                        Necesita humano
                                      </SelectItem>
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
                              {canManageCritical ? (
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
                                    <SelectItem value="SUPPORT">Soporte</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Badge variant="outline">{ROLE_LABELS[user.role]}</Badge>
                              )}
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
                                {canManageCritical && (
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
                                )}
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
