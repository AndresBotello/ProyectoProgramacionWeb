import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ usuario, children }) => {
  // Verifica si el usuario está autenticado
  return usuario ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
