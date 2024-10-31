import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Importa tus componentes
import Loguin from './components/Loguin';
import Home from './components/Home';
import Servicios from './components/Servicios'; 
import Portafolio from './components/Portafolio';
import CourseDetail from './components/CourseDetail'; 
import Inicio from './components/Inicio'; 
import ProtectedRoute from './components/ProtectedRoute';
import UserAccessForm from './components/UserAccessForm';  
import UserManagement from './components/UserManagement';
import CourseCreate from './components/CourseCreate';
import CourseList from './components/CourseList';
import EditCourse from './components/EditCourse';

function App() {
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const tipoUsuario = localStorage.getItem('tipo_usuario_id');
      const nombreUsuario = localStorage.getItem('nombre');

      if (nombreUsuario && tipoUsuario) {
        setUsuario({ nombre: nombreUsuario, tipo_usuario_id: tipoUsuario });
      } else {
        setUsuario(null);
      }
    };

    fetchUser();
  }, []);

  const handleLogin = (user) => {
    setUsuario(user); // Establece el usuario en el estado
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'GET', credentials: 'include' });
      setUsuario(null); // Elimina el usuario del estado
      localStorage.clear(); // Limpiar localStorage al cerrar sesión
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/home" element={usuario ? <Home usuario={usuario} onLogout={handleLogout} /> : <Home />} />
          <Route path="/servicios" element={
            <ProtectedRoute usuario={usuario}>
              <Servicios />
            </ProtectedRoute>
          } />
          <Route path="/crear-curso" element={
            <ProtectedRoute usuario={usuario}>
               <CourseCreate />
           </ProtectedRoute>
          } />
          <Route path="/portafolio" element={
            <ProtectedRoute usuario={usuario}>
              <Portafolio />
            </ProtectedRoute>
          } />
          {/* Aseguramos que la ruta de editar curso incluya el ID del curso */}
          <Route path="/cursos/editar/:courseId" element={
            <ProtectedRoute usuario={usuario}>
              <EditCourse />
            </ProtectedRoute>
          } />
          <Route path="/lista-cursos" element={
            <ProtectedRoute usuario={usuario}>
              <CourseList />
            </ProtectedRoute>
          } />
          <Route path="/user-access" element={
            <ProtectedRoute usuario={usuario}>
              <UserAccessForm />
            </ProtectedRoute>
          } />
          <Route path="/user-management" element={
            <ProtectedRoute usuario={usuario}>
              <UserManagement />
            </ProtectedRoute>
          } />
          <Route path="/cursos/:courseId" element={
            <ProtectedRoute usuario={usuario}>
              <CourseDetail />
            </ProtectedRoute>
          } />
          <Route path="/login" element={<Loguin onLogin={handleLogin} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;