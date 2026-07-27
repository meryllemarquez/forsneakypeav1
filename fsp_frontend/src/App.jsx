import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationProvider';
import { AuthProvider } from './context/AuthProvider';
import Layout from './components/layout/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';

import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';

export default function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Fullscreen Landing / Auth Page (Walang Layout Header/Footer) */}
            <Route path="/auth" element={<AuthPage />} />

            {/* Protected Pages (Nakabalot sa Layout) */}
            <Route
              path="/"
              element={
                <ProtectedRoute allowedRoles={['ROLE_USER', 'ROLE_ADMIN']}>
                 
                    <HomePage />
                  
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
                  <Layout>
                    <AdminPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </NotificationProvider>
  );
}