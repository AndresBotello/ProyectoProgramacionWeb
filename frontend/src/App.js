import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Importa tus componentes
import Loguin from './components/Loguin';
import Home from './components/Home';
import Instructor from './components/InstructorAcces';
import Portafolio from './components/Portafolio';
import CourseDetail from './components/CourseDetail'; 
import Inicio from './components/Inicio'; 
import ProtectedRoute from './components/ProtectedRoute';
import UserAccessForm from './components/UserAccessForm';  
import UserManagement from './components/UserManagement';
import CourseCreate from './components/CourseCreate';
import CourseList from './components/CourseList';
import EditCourse from './components/EditCourse';
import EvaluationCreate from './components/EvaluationCreate';
import UsuariosListIns from './components/UsuariosListIns';


function App() {
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const fetchUser = () => {
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
    setUsuario(user);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'GET', credentials: 'include' });
      setUsuario(null);
      localStorage.clear();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/home" element={<Home usuario={usuario} onLogout={handleLogout} />} />
          
          <Route path="/crear-evaluaciones" element={
            <ProtectedRoute usuario={usuario} requiredRole="2">
              <EvaluationCreate />
            </ProtectedRoute>
          } />

          <Route path="/crear-curso" element={
            <ProtectedRoute usuario={usuario} requiredRole="2">
              <CourseCreate />
            </ProtectedRoute>
          } />

          <Route path="/portafolio" element={
            <ProtectedRoute usuario={usuario} >
              <Portafolio />
            </ProtectedRoute>
          } />

          <Route path="/cursos/editar/:courseId" element={
            <ProtectedRoute usuario={usuario} requiredRole="2">
              <EditCourse />
            </ProtectedRoute>
          } />

          <Route path="/lista-cursos" element={
            <ProtectedRoute usuario={usuario} requiredRole="2,3">
              <CourseList />
            </ProtectedRoute>
          } />

          <Route path="/instructor" element={
            <ProtectedRoute usuario={usuario} requiredRole="3">
              <Instructor />
            </ProtectedRoute>
          } />

          <Route path="/user-access" element={
            <ProtectedRoute usuario={usuario} requiredRole="1">
              <UserAccessForm />
            </ProtectedRoute>
          } />

          <Route path="/user-management" element={
            <ProtectedRoute usuario={usuario} requiredRole="2,3">
              <UserManagement />
            </ProtectedRoute>
          } />

          <Route path="/usuarios-listinst" element={
            <ProtectedRoute usuario={usuario} requiredRole="3">
              <UsuariosListIns />
            </ProtectedRoute>
          } />

          <Route path="/cursos/:courseId" element={
            <ProtectedRoute usuario={usuario} requiredRole="1,2">
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
