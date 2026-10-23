import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import ProtectedRoute from './components/ProtectedRoute';
import PageLoader from './components/common/PageLoader/PageLoader';

// Code-split the three heavy feature pages (Memories, Dates, Love Letters). Home and Auth stay in
// the main bundle because they are the entry points; the others download on first visit, and a
// cached copy makes later visits instant.
const MemoriesPage = lazy(() => import('./pages/MemoriesPage'));
const DatesPage = lazy(() => import('./pages/DatesPage'));
const LoveLettersPage = lazy(() => import('./pages/LoveLettersPage'));

// Code-split: the whole admin control center is only ever reached by
// ROLE_ADMIN accounts (gated below by ProtectedRoute), so it shouldn't be
// part of the JS bundle every couple-account user downloads just to see
// Home/Memories/Dates/Letters.
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const DashboardHome = lazy(() => import('./pages/admin/DashboardHome'));
const NotificationsPage = lazy(() => import('./pages/admin/NotificationsPage'));
const ActivityLogPage = lazy(() => import('./pages/admin/ActivityLogPage'));
const AuditTrailPage = lazy(() => import('./pages/admin/AuditTrailPage'));
const UsersPage = lazy(() => import('./pages/admin/UsersPage'));
const AdminMemoriesPage = lazy(() => import('./pages/admin/AdminMemoriesPage'));
const AdminLettersPage = lazy(() => import('./pages/admin/AdminLettersPage'));
const AdminDatesPage = lazy(() => import('./pages/admin/AdminDatesPage'));
const AdminGalleryPage = lazy(() => import('./pages/admin/AdminGalleryPage'));
const SystemSettingsPage = lazy(() => import('./pages/admin/SystemSettingsPage'));

import { AuthProvider } from './context/AuthProvider';
import { NotificationProvider } from './context/NotificationProvider';

export default function App() {
  return (
    <Router>
      {/* 2. I-WRAP ANG ROUTES SA LOOB NG AUTHPROVIDER */}
      <AuthProvider>
      <NotificationProvider>
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
                <Suspense fallback={<PageLoader />}>
                  <MemoriesPage />
                </Suspense>
              </ProtectedRoute>
            } 
          />

          {/* Phase 2: Premium Date Bucket List (mock data, backend not yet wired) */}
          <Route
            path="/dates"
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                  <DatesPage />
                </Suspense>
              </ProtectedRoute>
            }
          />

          {/* Phase 7: Interactive Love Board */}
          <Route
            path="/letters"
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                  <LoveLettersPage />
                </Suspense>
              </ProtectedRoute>
            }
          />

          {/* Profile Customization — couple accounts only, admin excluded */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['ROLE_USER']}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Phase 8: Admin Control Center */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
                <Suspense fallback={null}>
                  <AdminLayout />
                </Suspense>
              </ProtectedRoute>
            }
          >
            <Route index element={<Suspense fallback={null}><DashboardHome /></Suspense>} />
            <Route path="notifications" element={<Suspense fallback={null}><NotificationsPage /></Suspense>} />
            <Route path="activity" element={<Suspense fallback={null}><ActivityLogPage /></Suspense>} />
            <Route path="users" element={<Suspense fallback={null}><UsersPage /></Suspense>} />
            <Route path="memories" element={<Suspense fallback={null}><AdminMemoriesPage /></Suspense>} />
            <Route path="letters" element={<Suspense fallback={null}><AdminLettersPage /></Suspense>} />
            <Route path="dates" element={<Suspense fallback={null}><AdminDatesPage /></Suspense>} />
            <Route path="gallery" element={<Suspense fallback={null}><AdminGalleryPage /></Suspense>} />
            <Route path="settings" element={<Suspense fallback={null}><SystemSettingsPage /></Suspense>} />
            <Route path="audit" element={<Suspense fallback={null}><AuditTrailPage /></Suspense>} />
          </Route>

          {/* Default Redirect */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}