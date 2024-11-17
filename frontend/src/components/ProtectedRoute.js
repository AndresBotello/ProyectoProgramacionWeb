import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRole }) => {
  const token = localStorage.getItem('token');
  const tipoUsuario = localStorage.getItem('tipo_usuario_id');


  const allowedRoles = requiredRole.split(',');
  if (!token || !allowedRoles.includes(tipoUsuario)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
