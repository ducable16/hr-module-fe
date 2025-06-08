import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Home from '../pages/Home';

interface RouteConfig {
  path: string;
  element: React.ReactNode;
}

// Public routes - accessible without authentication
const publicRoutes: RouteConfig[] = [
  {
    path: '/login',
    element: <Login />,
  },
];

// Protected routes - require authentication
const protectedRoutes: RouteConfig[] = [
  {
    path: '/home',
    element: <Home />,
  },
];

const AppRoutes: React.FC = () => {
  // Kiểm tra đăng nhập dựa trên accessToken trong localStorage
  const isAuthenticated = Boolean(localStorage.getItem('accessToken'));

  return (
    <Routes>
      {/* Public Routes */}
      {publicRoutes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={route.element}
        />
      ))}

      {/* Protected Routes */}
      {protectedRoutes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={
            isAuthenticated ? (
              route.element
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      ))}

      {/* Default redirect */}
      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? "/home" : "/login"} replace />}
      />

      {/* 404 route */}
      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />
    </Routes>
  );
};

export default AppRoutes; 