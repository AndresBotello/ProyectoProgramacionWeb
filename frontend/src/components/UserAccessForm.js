import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../UserAccessForm.css';
import Footer from './Footer';

// Componente para renderizar los cursos
const CourseItem = ({ course, onClick }) => {
  return (
    <div className="curso-card" onClick={onClick}>
      <h3>{course.titulo}</h3>
      <p>{course.descripcion}</p>
      <p>Precio: ${course.precio}</p>
      <div className="progress-bar">
        <div className="progress" style={{ width: `${course.progreso}%` }}></div>
      </div>
      <p>{course.progreso}% completado</p>
    </div>
  );
};

const UserAccessForm = () => {
  const [cursos, setCursos] = useState([]);
  const [error, setError] = useState(null);
  const [nombreUsuario, setNombreUsuario] = useState(localStorage.getItem('nombre') || 'Usuario');
  const [emailUsuario, setEmailUsuario] = useState(localStorage.getItem('correo') || 'Correo');
  const [isLoading, setIsLoading] = useState(true);
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('nombre');
    localStorage.removeItem('correo');
    alert("Sesión cerrada exitosamente");
    navigate('/login');
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchCursos = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('http://localhost:3000/api/cursos/todos', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Error al obtener los cursos');
        }

        const data = await response.json();
        setCursos(data.data || []);
      } catch (error) {
        console.error('Error al obtener cursos:', error);
        setError('Error al obtener cursos: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCursos();
  }, [navigate, token]);

  return (
    <div className="user-profile-container">
      <div className="profile-banner">
        <div className="header-left">
          <h1>Bienvenido, {nombreUsuario}</h1>
        </div>
        <div className="header-right">
          <button className="btn-logout" onClick={handleLogout}>Cerrar Sesión</button>
        </div>
      </div>

      <div className="profile-section">
        <div className="profile-picture">
          <img src="https://via.placeholder.com/150" alt="Perfil de Usuario" />
        </div>
        <div className="profile-info">
          <h2>{nombreUsuario}</h2>
          <p>{emailUsuario}</p>
          <p>¡Sigue aprendiendo con tus cursos!</p>
        </div>
      </div>

      <h2>Cursos Disponibles</h2>
      {isLoading ? (
        <p>Cargando cursos...</p>
      ) : error ? (
        <p>{error}</p>
      ) : cursos.length > 0 ? (
        <div className="cursos-list">
          {cursos.map(curso => (
            <CourseItem 
              key={curso.id} 
              course={curso} 
              onClick={() => navigate(`/cursos/${curso.id}`)} 
            />
          ))}
        </div>
      ) : (
        <p>No hay cursos disponibles.</p>
      )}

      <Footer />
    </div>
  );
};

export default UserAccessForm;
