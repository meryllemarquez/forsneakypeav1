import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import MemoriesPage from './pages/MemoriesPage';
import DatesPage from './pages/DatesPage';
import LoveLettersPage from './pages/LoveLettersPage';
import ProtectedRoute from './components/ProtectedRoute';

import AdminLayout from './components/admin/AdminLayout';
import DashboardHome from './pages/admin/DashboardHome';
import NotificationsPage from './pages/admin/NotificationsPage';
import ActivityLogPage from './pages/admin/ActivityLogPage';
import AuditTrailPage from './pages/admin/AuditTrailPage';
import UsersPage from './pages/admin/UsersPage';
import AdminMemoriesPage from './pages/admin/AdminMemoriesPage';
import AdminLettersPage from './pages/admin/AdminLettersPage';
import AdminDatesPage from './pages/admin/AdminDatesPage';
import AdminGalleryPage from './pages/admin/AdminGalleryPage';
import SystemSettingsPage from './pages/admin/SystemSettingsPage';


import { AuthProvider } from './context/AuthProvider';

export default function App() {
  return (
    <Router>
      {/* 2. I-WRAP ANG ROUTES SA LOOB NG AUTHPROVIDER */}
      <AuthProvider>
        <Routes>
          {/* Public Landing & Login Page */}
          <Route path="/auth" element={<AuthPage />} />

          {/* Protected Couple Sanctuary */}
          <Route 
            path="/home" 
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            } 
          />

          {/* Phase 5: Memories & Album System */}
          <Route 
            path="/memories" 
            element={
              <ProtectedRoute>
                <MemoriesPage />
              </ProtectedRoute>
            } 
          />

          {/* Phase 2: Premium Date Bucket List (mock data, backend not yet wired) */}
          <Route
            path="/dates"
            element={
              <ProtectedRoute>
                <DatesPage />
              </ProtectedRoute>
            }
          />

          {/* Phase 7: Interactive Love Board */}
          <Route
            path="/letters"
            element={
              <ProtectedRoute>
                <LoveLettersPage />
              </ProtectedRoute>
            }
          />

          {/* Phase 8: Admin Control Center */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardHome />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="activity" element={<ActivityLogPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="memories" element={<AdminMemoriesPage />} />
            <Route path="letters" element={<AdminLettersPage />} />
            <Route path="dates" element={<AdminDatesPage />} />
            <Route path="gallery" element={<AdminGalleryPage />} />
            <Route path="settings" element={<SystemSettingsPage />} />
            <Route path="audit" element={<AuditTrailPage />} />
          </Route>

          {/* Default Redirect */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}