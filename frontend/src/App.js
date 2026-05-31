import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import { LoginPage, RegisterPage } from './components/AuthPages';
import Dashboard from './components/Dashboard';
import AnalyticsPage from './components/AnalyticsPage';
import SharedTasksPage from './components/SharedTasksPage';

const Loader = () => (
  <div className="loader-wrap" style={{ minHeight: '100vh' }}>
    <div className="loader" />
  </div>
);

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  return !user ? children : <Navigate to="/" replace />;
};

const PrivateLayout = ({ children }) => (
  <>
    <Navbar />
    <main className="main-content">{children}</main>
  </>
);

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/" element={<PrivateRoute><PrivateLayout><Dashboard /></PrivateLayout></PrivateRoute>} />
      <Route path="/analytics" element={<PrivateRoute><PrivateLayout><AnalyticsPage /></PrivateLayout></PrivateRoute>} />
      <Route path="/shared" element={<PrivateRoute><PrivateLayout><SharedTasksPage /></PrivateLayout></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
