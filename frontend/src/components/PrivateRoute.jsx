// components/PrivateRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#e86a92' }}></i>
      </div>
    );
  }

  // Pass the attempted path so Login can redirect back after login
  return user ? children : <Navigate to="/login" state={{ from: location.pathname }} replace />;
};

export default PrivateRoute;
