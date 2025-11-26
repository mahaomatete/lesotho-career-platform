import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user, loading } = useAuth();

  console.log('🛡️ ProtectedRoute check:', { 
    isAuthenticated, 
    userRole: user?.role, 
    requiredRole,
    loading 
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Verifying authentication...
        </Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    console.log('🔐 Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    console.log('🚫 Insufficient permissions:', user?.role, 'needed:', requiredRole);
    return <Navigate to="/dashboard" replace />;
  }

  console.log('✅ Access granted to protected route');
  return children;
};

export default ProtectedRoute;