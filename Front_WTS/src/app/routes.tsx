import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { MapPage } from './pages/MapPage';
import { Itinerary } from './pages/Itinerary';
import { Booking } from './pages/Booking';
import { Reviews } from './pages/Reviews';
import { Chat } from './pages/Chat';
import { Profile } from './pages/Profile';
import { AdminDashboard } from './pages/AdminDashboard';
import { NotFound } from './pages/NotFound';
import { HomeUsuarioLogueado } from './pages/HomeUsuarioLogueado';
import { ServiceForm } from './pages/ServiceForm';
import { EditProfile } from './pages/EditProfile';
import { AccesorDashboard } from './pages/AccesorDashboard';
import { BookingDetail } from './pages/BookingDetail';

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
      { path: '*', Component: NotFound },
      {path: 'home-logueado', Component: HomeUsuarioLogueado },
      { path: 'edit-profile', Component: EditProfile },
      { path: 'dashboard-accesor', Component: AccesorDashboard },
{ path: 'create-service', Component: ServiceForm },
{ path: 'edit-service/:id', Component: ServiceForm }, 
{ path: 'booking-detail/:id', Component: BookingDetail },   ],
  },
]);