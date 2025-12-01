import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from './usePermissions';

interface PermissionRouteProps {
  permission: string;
  children: React.ReactNode;
}

// Lightweight wrapper that enforces subpage-level permissions on top of
// existing role-based routes. If the current user does not have the required
// permission, they are redirected without altering existing layouts.
export function PermissionRoute({ permission, children }: PermissionRouteProps) {
  const { ready, can } = usePermissions();

  if (!ready) {
    return (
      <div className="p-8 text-sm zynq-muted">
        Loading permissions...
      </div>
    );
  }

  if (!can(permission)) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}
