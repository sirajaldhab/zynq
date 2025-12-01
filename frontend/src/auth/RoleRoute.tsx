import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function RoleRoute({ allow }: { allow: string[] }) {
  const { accessToken, role } = useAuth();
  const location = useLocation();
  if (!accessToken) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }
  const normalizedRole = (role || '').trim().toUpperCase().replace(/\s+/g, '_');
  const normalizedAllow = allow.map((r) => r.trim().toUpperCase().replace(/\s+/g, '_'));
  if (!role || (normalizedAllow.length > 0 && !normalizedAllow.includes(normalizedRole))) {
    return <Navigate to="/403" replace />;
  }
  return <Outlet />;
}
