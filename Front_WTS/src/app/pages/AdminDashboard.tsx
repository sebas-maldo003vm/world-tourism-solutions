import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { mockServices, mockSupportTickets } from '../Services/mockData';
import { Search, Edit, Trash2, Users, FileText, Calendar, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';


export function AdminDashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-6">
          
          <h1 className="text-3xl font-bold mb-2">Panel de Administración</h1>
          <p className="text-gray-600">Gestiona servicios, usuarios y soporte</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div>
                <p className="text-sm text-gray-600">Total Servicios</p>
                <p className="text-3xl font-bold">{mockServices.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div>
                <p className="text-sm text-gray-600">Tickets Soporte</p>
                <p className="text-3xl font-bold">{mockSupportTickets.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div>
                <p className="text-sm text-gray-600">Usuarios</p>
                <p className="text-3xl font-bold">15</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
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

              {/* SERVICIOS (NO TOCADO) */}
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
                      {mockServices.map((service) => (
                        <TableRow key={service.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <img
                                src={service.image}
                                alt={service.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                              <div>
                                <div className="font-medium">{service.name}</div>
                                <div className="text-sm text-gray-600">{service.location}</div>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>{service.category}</TableCell>
                          <TableCell>${service.price}</TableCell>
                          <TableCell>{service.rating} ⭐</TableCell>

                          <TableCell>
                            <Badge variant="default">Activo</Badge>
                          </TableCell>

                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="ghost">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="text-red-600">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>

                  </Table>
                </div>
              </TabsContent>

              {/* SOPORTE (NUEVO) */}
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
                      {mockSupportTickets.map((ticket) => (
                        <TableRow key={ticket.id}>
                          <TableCell>#{ticket.id}</TableCell>
                          <TableCell>{ticket.userName}</TableCell>
                          <TableCell>{ticket.serviceName}</TableCell>

                          <TableCell>
                            <Badge
                              variant={
                                ticket.urgency === 'high'
                                  ? 'destructive'
                                  : ticket.urgency === 'medium'
                                    ? 'secondary'
                                    : 'default'
                              }
                            >
                              {ticket.urgency === 'high'
                                ? 'Alta'
                                : ticket.urgency === 'medium'
                                  ? 'Media'
                                  : 'Baja'}
                            </Badge>
                          </TableCell>

                          <TableCell>{ticket.date}</TableCell>

                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="ghost">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="text-red-600">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="bg-blue-600 hover:bg-blue-700 rounded-full">
                              Contactar
                            </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>

                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="users" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Usuarios</h3>
                  
<Button className="bg-blue-600 hover:bg-blue-700 rounded-full">
                    Agregar usuario
                  </Button>

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
                      <TableRow>
                        <TableCell className="font-medium">Sebastian Maldonado</TableCell>
                        <TableCell>correonn@gmail.com</TableCell>
                        <TableCell>
                          <Badge>Usuario</Badge>
                        </TableCell>
                        <TableCell>2026-03-15</TableCell>
                        <TableCell>
                          <Badge variant="default">Activo</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="ghost">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Carlos Rodríguez</TableCell>
                        <TableCell>carlos.rodriguez@email.com</TableCell>
                        <TableCell>
                          <Badge variant="secondary">Accesor</Badge>
                        </TableCell>
                        <TableCell>2026-02-10</TableCell>
                        <TableCell>
                          <Badge variant="default">Activo</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="ghost">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



