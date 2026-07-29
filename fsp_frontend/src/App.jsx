import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import MemoriesPage from './pages/MemoriesPage';
import ProtectedRoute from './components/ProtectedRoute';


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

          {/* Admin Route */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requiredRole="ROLE_ADMIN">
                <AdminPage />
              </ProtectedRoute>
            } 
          />

          {/* Default Redirect */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}