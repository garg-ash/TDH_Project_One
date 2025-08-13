'use client';

import React, { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string | string[];
  requiredPermission?: string;
  requiredResource?: string;
  requiredAction?: string;
  fallback?: ReactNode;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredPermission,
  requiredResource,
  requiredAction,
  fallback = <div>Access Denied</div>,
  redirectTo = '/login'
}) => {
  const { user, loading, hasRole, hasPermission, canAccess } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectTo);
    }
  }, [loading, user, router, redirectTo]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!user) {
    return null; // Will redirect in useEffect
  }

  // Check role requirements
  if (requiredRole && !hasRole(requiredRole)) {
    return fallback;
  }

  // Check permission requirements
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return fallback;
  }

  // Check resource access requirements
  if (requiredResource && requiredAction && !canAccess(requiredResource, requiredAction)) {
    return fallback;
  }

  // All checks passed, render children
  return <>{children}</>;
};

// Convenience components for common use cases
export const SuperAdminOnly: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRole="super_admin">
    {children}
  </ProtectedRoute>
);

export const AdminOnly: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRole={['super_admin', 'admin']}>
    {children}
  </ProtectedRoute>
);

export const AuthenticatedOnly: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ProtectedRoute>
    {children}
  </ProtectedRoute>
);
