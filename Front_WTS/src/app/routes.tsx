import { createBrowserRouter } from 'react-router-dom';
import { Layout } from '../shared/components/layout/Layout';
import { Home } from '../features/catalog/pages/Home';
import { HomeUsuarioLogueado } from '../features/catalog/pages/HomeUsuarioLogueado';
import { MapPage } from '../features/catalog/pages/MapPage';
import { Login } from '../features/auth/pages/Login';
import { Register } from '../features/auth/pages/Register';
import { Booking } from '../features/bookings/pages/Booking';
import { BookingDetail } from '../features/bookings/pages/BookingDetail';
import { Itinerary } from '../features/bookings/pages/Itinerary';
import { Reviews } from '../features/reviews/pages/Reviews';
import { AccesorDashboard } from '../features/provider/pages/AccesorDashboard';
import { ServiceForm } from '../features/provider/pages/ServiceForm';
import { Profile } from '../features/profile/pages/Profile';
import { EditProfile } from '../features/profile/pages/EditProfile';
import { Chat } from '../features/chat/pages/Chat';
import { AdminDashboard } from '../features/admin/pages/AdminDashboard';
import { NotFound } from '../features/common/pages/NotFound';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: 'login', Component: Login },
      { path: 'register', Component: Register },
      { path: 'map', Component: MapPage },
      { path: 'itinerary', Component: Itinerary },
      { path: 'booking/:id', Component: Booking },
      { path: 'reviews/:id', Component: Reviews },
      { path: 'chat', Component: Chat },
      { path: 'profile', Component: Profile },
      { path: 'admin', Component: AdminDashboard },
      { path: 'home-logueado', Component: HomeUsuarioLogueado },
      { path: 'edit-profile', Component: EditProfile },
      { path: 'dashboard-accesor', Component: AccesorDashboard },
      { path: 'create-service', Component: ServiceForm },
      { path: 'edit-service/:id', Component: ServiceForm },
      { path: 'booking-detail/:id', Component: BookingDetail },
      { path: '*', Component: NotFound },
    ],
  },
]);
