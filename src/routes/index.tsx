import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login/Login';
import Home from '../pages/Home/Home';
import ProjectList from '../pages/Projects/ProjectList';
import PMProjectList from '../pages/Projects/PMProjectList';
import EmployeeList from '../pages/Employees/EmployeeList';
import AssignmentList from '../pages/Assignments/AssignmentList';
import EmployeeHistory from '../pages/History/EmployeeHistory';

interface RouteConfig {
  path: string;
  element: React.ReactNode;
}

const publicRoutes: RouteConfig[] = [
  {
    path: '/login',
    element: <Login />,
  },
];

const protectedRoutes: RouteConfig[] = [
  {
    path: '/home',
    element: <Home />,
  },
  {
    path: '/projects',
    element: <Home><ProjectList /></Home>,
  },
  {
    path: '/pm-projects',
    element: <Home><PMProjectList /></Home>,
  },
  {
    path: '/employees',
    element: <Home><EmployeeList /></Home>,
  },
  {
    path: '/assignments',
    element: <Home><AssignmentList /></Home>,
  },
  {
    path: '/history',
    element: <Home><EmployeeHistory /></Home>,
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