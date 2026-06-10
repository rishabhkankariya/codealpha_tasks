import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChatPage from './pages/ChatPage';
import AdminPage from './pages/AdminPage';

// Route guard for authenticated users
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-chatBg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-chatPrimary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-chatTextMuted">Loading user session...</span>
        </div>
      </div>
    );
  }
  
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

// Route guard for administrators only
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-chatBg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-chatPrimary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-chatTextMuted">Authenticating administrator...</span>
        </div>
      </div>
    );
  }
  
  if (!token) return <Navigate to="/login" replace />;
  return user?.role === 'admin' ? <>{children}</> : <Navigate to="/" replace />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Pages */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Chat Dashboard Interface */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            } 
          />

          {/* Protected Administrative Dashboard */}
          <Route 
            path="/admin" 
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            } 
          />

          {/* Fallback Catch-all routing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
