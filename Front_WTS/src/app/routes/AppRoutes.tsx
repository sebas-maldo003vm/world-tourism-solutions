import { createBrowserRouter } from 'react-router-dom';
import { Layout } from '@/shared/components/layout/Layout';
import { Home } from '@/features/catalog/pages/Home';
import { HomeUsuarioLogueado } from '@/features/catalog/pages/HomeUsuarioLogueado';
import { Login } from '@/features/auth/pages/Login';
import { Register } from '@/features/auth/pages/Register';
import { Booking } from '@/features/bookings/pages/Booking';
import { BookingDetail } from '@/features/bookings/pages/BookingDetail';
import { Itinerary } from '@/features/bookings/pages/Itinerary';
import { Reviews } from '@/features/reviews/pages/Reviews';
import { AccesorDashboard } from '@/features/provider/pages/AccesorDashboard';
import { ProviderAnalytics } from '@/features/provider/pages/ProviderAnalytics';
import { ServiceForm } from '@/features/provider/pages/ServiceForm';
import { Profile } from '@/features/profile/pages/Profile';
import { EditProfile } from '@/features/profile/pages/EditProfile';
import { Chat } from '@/features/chat/pages/Chat';
import { AdminDashboard } from '@/features/admin/pages/AdminDashboard';
import { NotFound } from '@/features/common/pages/NotFound';
import { ProtectedRoute } from '@/app/routes/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: 'login', Component: Login },
      { path: 'register', Component: Register },
      { path: 'booking/:id', Component: Booking },
      { path: 'reviews/:id', Component: Reviews },
      { path: 'booking-detail/:id', Component: BookingDetail },
      { path: '*', Component: NotFound },

      {
        path: 'admin',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN', 'SUPPORT']}>
            <AdminDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'dashboard-accesor',
        element: (
          <ProtectedRoute allowedRoles={['PROVIDER']}>
            <AccesorDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'analitica',
        element: (
          <ProtectedRoute allowedRoles={['PROVIDER']}>
            <ProviderAnalytics />
          </ProtectedRoute>
        ),
      },
      {
        path: 'create-service',
        element: (
          <ProtectedRoute allowedRoles={['PROVIDER']}>
            <ServiceForm />
          </ProtectedRoute>
        ),
      },
      {
        path: 'edit-service/:id',
        element: (
          <ProtectedRoute allowedRoles={['PROVIDER']}>
            <ServiceForm />
          </ProtectedRoute>
        ),
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: 'edit-profile',
        element: (
          <ProtectedRoute>
            <EditProfile />
          </ProtectedRoute>
        ),
      },
      {
        path: 'itinerary',
        element: (
          <ProtectedRoute>
            <Itinerary />
          </ProtectedRoute>
        ),
      },
      {
        path: 'home-logueado',
        element: (
          <ProtectedRoute>
            <HomeUsuarioLogueado />
          </ProtectedRoute>
        ),
      },
      {
        path: 'chat',
        element: (
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        ),
      },
      {
        path: 'messages',
        element: (
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);
