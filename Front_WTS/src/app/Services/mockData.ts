export interface Service {
  id: string;
  name: string;
  category: 'Restaurantes' | 'Actividades' | 'Hospedaje';
  price: number;
  rating: number;
  image: string;
  imageUrls?: string[];
  location: string;
  description: string;
  lat: number;
  lng: number;
}
export interface SupportTicket {
  id: string;
  userName: string;
  serviceName: string;
  urgency: 'low' | 'medium' | 'high';
  message: string;
  date: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  serviceId: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Booking {
  id: string;
  serviceId: string;
  serviceName: string;
  date: string;
  people: number;
  totalPrice: number;
  status: 'pending' | 'approved' | 'rejected';
  userName: string;
  userEmail: string;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  isOwn: boolean;
}

export interface Conversation {
  id: string;
  serviceName: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
}

export const mockSupportTickets: SupportTicket[] = [
  {
    id: '1',
    userName: 'Juan Pérez',
    serviceName: 'Hotel',
    urgency: 'high',
    message: 'Problema con la reserva',
    date: '2026-04-20'
  },
  {
    id: '2',
    userName: 'Camila',
    serviceName: 'Senderismo',
    urgency: 'medium',
    message: 'No recibí confirmación',
    date: '2026-04-22'
  },
  {
    id: '3',
    userName: 'Miguel',
    serviceName: 'Restaurante 1',
    urgency: 'low',
    message: 'No responden ',
    date: '2026-04-25'
  }
];

export const mockServices: Service[] = [
  {
    id: '1',
    name: 'Restaurante 1',
    category: 'Restaurantes',
    price: 45,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1744776411223-71fb5794617a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjByZXN0YXVyYW50JTIwaW50ZXJpb3J8ZW58MXx8fHwxNzc2MzUzMjQ3fDA&ixlib=rb-4.1.0&q=80&w=1080',
    location: 'Centro Histórico',
    description: 'Cocina mediterránea con vista panorámica',
    lat: 40.4168,
    lng: -3.7038
  },
  {
    id: '2',
    name: 'Senderismo',
    category: 'Actividades',
    price: 65,
    rating: 4.9,
    image: '/imagen/send.jfif',
    location: 'Sierra Norte',
    description: 'Ruta guiada de 6 horas con almuerzo incluido',
    lat: 40.5168,
    lng: -3.6038
  },
  {
    id: '3',
    name: 'Hotel',
    category: 'Hospedaje',
    price: 120,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1731336478850-6bce7235e320?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib3V0aXF1ZSUyMGhvdGVsJTIwYmVkcm9vbXxlbnwxfHx8fDE3NzYzNzc1MTR8MA&ixlib=rb-4.1.0&q=80&w=1080',
    location: 'Zona Colonial',
    description: 'Habitaciones de lujo con desayuno incluido',
    lat: 40.4268,
    lng: -3.7138
  },
  {
    id: '4',
    name: 'Resort Playa Azul',
    category: 'Hospedaje',
    price: 200,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1558117338-aa433feb1c62?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cm9waWNhbCUyMGJlYWNoJTIwcmVzb3J0fGVufDF8fHx8MTc3NjMwMjkyNnww&ixlib=rb-4.1.0&q=80&w=1080',
    location: 'Costa del Sol',
    description: 'Resort todo incluido frente al mar',
    lat: 40.3168,
    lng: -3.8038
  },
  {
    id: '5',
    name: 'Restaurante X ',
    category: 'Restaurantes',
    price: 100,
    rating: 4.6,
    image: '/imagen/restauran.jpg',
    location: 'Barrio Gourmet',
    description: 'Experiencia gastronómica de autor',
    lat: 40.4368,
    lng: -3.6938
  },
  {
    id: '6',
    name: 'Actividad X',
    category: 'Actividades',
    price: 150,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1775133453963-3030ac9fe0a1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b2dhJTIwd2VsbG5lc3MlMjByZXRyZWF0fGVufDF8fHx8MTc3NjI4NDQ1NXww&ixlib=rb-4.1.0&q=80&w=1080',
    location: 'Valle Sereno',
    description: 'Sesión de yoga y meditación en la naturaleza',
    lat: 40.4468,
    lng: -3.7238
  },
  {
    id: '7',
    name: 'Café ',
    category: 'Restaurantes',
    price: 83,
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1739723745132-97df9db49db2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3p5JTIwY2FmZSUyMGludGVyaW9yfGVufDF8fHx8MTc3NjM2NDUzOHww&ixlib=rb-4.1.0&q=80&w=1080',
    location: 'Plaza del Arte',
    description: 'Café de especialidad y brunch',
    lat: 40.4068,
    lng: -3.7138
  },
  {
    id: '8',
    name: 'Cuatrimotos',
    category: 'Actividades',
    price: 85,
    rating: 4.9,
    image: '/imagen/cua.jfif',
    location: 'Bahía Azul',
    description: 'Inmersión guiada con equipo incluido',
    lat: 40.3268,
    lng: -3.7938
  },
  {
    id: '9',
    name: 'Rest 2',
    category: 'Hospedaje',
    price: 150,
    rating: 4.7,
    image: '/imagen/restauran.jpg',
    location: 'Centro',
    description: 'Hotel 5 estrellas en el corazón de la ciudad',
    lat: 40.4168,
    lng: -3.7238
  }
];

export const mockReviews: Review[] = [
  {
    id: '1',
    userId: 'user1',
    userName: 'María García',
    serviceId: '1',
    rating: 5,
    comment: 'Excelente experiencia, la comida y el servicio fueron impecables.',
    date: '2026-04-10'
  },
  {
    id: '2',
    userId: 'user2',
    userName: 'Carlos Rodríguez',
    serviceId: '1',
    rating: 4,
    comment: 'Muy bueno, aunque un poco caro.',
    date: '2026-04-08'
  }
];

export const mockBookings: Booking[] = [
  {
    id: '1',
    serviceId: '3',
    serviceName: 'Hotel',
    date: '2026-05-15',
    people: 2,
    totalPrice: 240,
    status: 'approved',
  userName: 'Juan Pérez',
    userEmail: 'juan@email.com'
  },
  {
    id: '2',
    serviceId: '2',
    serviceName: 'Senderismo Montaña ',
    date: '2026-04-25',
    people: 4,
    totalPrice: 120,
    status: 'pending',
  userName: 'Daniel',
  userEmail: 'Daniel@email.com'
  },
  {
    id: '7',
    serviceId: '1',
    serviceName: "Tour en montaña",
    date: "2026-04-30",
    people: 3,
    totalPrice: 150,
    status: "pending",
  userName: 'Andres',
  userEmail: 'Andresxd@email.com'
  },
  {
    id: '6',
    serviceId: '2',
    serviceName: "Caminata ecológica",
    date: "2026-05-02",
    people: 2,
    totalPrice: 90,
    status: "approved",
  userName: 'Juan Pablo',
  userEmail: 'juanxd@email.com'
  },{
  id: '2',
  serviceId: '2',
    serviceName: 'Senderismo Montaña ',
    date: '2026-04-25',
    people: 4,
    totalPrice: 120,
  status: 'approved',
  userName: 'Camila',
  userEmail: 'camila@email.com'
},
{
  id: '6',
  serviceId: '2',
    serviceName: "Caminata ecológica",
    date: "2026-05-02",
    people: 2,
    totalPrice: 90,
  status: 'pending',
  userName: 'Laura',
  userEmail: 'laura@email.com'
},
{
  id: '7',
  serviceId: '1',
    serviceName: "Tour en montaña",
    date: "2026-04-30",
    people: 3,
    totalPrice: 150,
  status: 'rejected',
  userName: 'Miguel',
  userEmail: 'miguel@email.com'
}

];

export const mockConversations: Conversation[] = [
  {
    id: '1',
    serviceName: 'Hotel ',
    lastMessage: '¿Tienen disponibilidad para el fin de semana?',
    timestamp: '10:30 AM',
    unread: 2
  },
  {
    id: '2',
    serviceName: 'Restaurante 3',
    lastMessage: 'Gracias por su reserva',
    timestamp: 'Ayer',
    unread: 0
  }
];

export const mockMessages: Message[] = [
  {
    id: '1',
    senderId: 'user1',
    text: 'Hola, quisiera hacer una reserva para este fin de semana',
    timestamp: '10:28 AM',
    isOwn: true
  },
  {
    id: '2',
    senderId: 'service1',
    text: '¡Hola! Claro, con gusto. ¿Para cuántas personas?',
    timestamp: '10:29 AM',
    isOwn: false
  },
  {
    id: '3',
    senderId: 'user1',
    text: '¿Tienen disponibilidad para el fin de semana?',
    timestamp: '10:30 AM',
    isOwn: true
  }
];
