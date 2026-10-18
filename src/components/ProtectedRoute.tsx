// ============================================================
// ProtectedRoute — Role-aware route guard & redirection
// ============================================================
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { User } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: User['role'][];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { currentUser } = useApp();
  const location = useLocation();

  if (!currentUser) {
    // Redirect unauthenticated visitors to login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    // Redirect authenticated users to their own role dashboard
    if (currentUser.role === 'citizen') {
      return <Navigate to="/dashboard" replace />;
    } else if (currentUser.role === 'officer') {
      return <Navigate to="/officer" replace />;
    } else if (currentUser.role === 'admin' || currentUser.role === 'super_admin') {
      return <Navigate to="/admin" replace />;
    }
  }

  return <>{children}</>;
}
