import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

export const ProtectedRoute: React.FC = () => {
  const { accessToken } = useAuth();
  if (!accessToken) return <Navigate to="/auth/login" replace />;
  return <Outlet />;
};
