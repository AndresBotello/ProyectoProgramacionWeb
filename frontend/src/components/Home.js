import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';  
import '../Home.css'; 
import Footer from './Footer';

const Home = () => {
  const navigate = useNavigate();  
  const [cursos, setCursos] = useState([]);
  const [nombreUsuario, setNombreUsuario] = useState(localStorage.getItem('nombre') || 'Usuario');
  const [isLoading, setIsLoading] = useState(true);
  const token = localStorage.getItem('token'); 
  const tipoUsuario = localStorage.getItem('tipo_usuario_id');

  useEffect(() => {
    if (tipoUsuario !== '2') {
      alert("Acceso denegado. Solo los administradores pueden acceder.");
      navigate('/login'); 
      return;
    }

    if (token) {
      fetchCursos();
    } else {
      console.log("No token found, redirecting to login");
      navigate('/login');
    }
  }, [navigate, token, tipoUsuario]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('nombre');
    localStorage.removeItem('tipo_usuario_id');
    setNombreUsuario('Usuario');
    alert("Sesión cerrada exitosamente");
    navigate('/login'); 
  };

  const fetchCursos = async () => {
    if (cursos.length > 0) return; // Evita recargas innecesarias si ya se tienen datos
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/cursos/todos', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message);
      }
      setCursos(data.data); 
    } catch (error) {
      console.error("Error al cargar cursos: ", error);
      if (error.message === "Unauthorized") {
        handleLogout(); 
      }
    } finally {
      setIsLoading(false); 
    }
  };

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="header-left">
          <h1>Bienvenido a LorenArt, {nombreUsuario}</h1> 
          <p className="subtitle">Plataforma de cursos de artes plásticas y dibujo</p>
        </div>
        <div className="header-right">
          <button className="btn-logout" onClick={handleLogout}>Cerrar Sesión</button>
        </div>
      </header>

      <div className="main-content">
        <aside className="buttons-container">
          <button className="btn btn-secondary" onClick={() => navigate('/crear-curso')}>Crear Cursos</button>
          <button className="btn btn-info" onClick={() => navigate('/lista-cursos')}>Lista de Cursos</button>
          <button className="btn btn-warning" onClick={() => navigate('/user-management')}>Gestionar Usuarios</button>
          <button className="btn btn-portfolio" onClick={() => navigate('/portafolio')}>Editar Portafolio</button>
          <button className="btn btn-light" onClick={() => navigate('/contacto')}>Contactar</button>
        </aside>

        <section className="content-section">
          <h2>Cursos Disponibles</h2>
          <p>Explora nuestros cursos y mejora tus habilidades artísticas.</p>
          {isLoading ? (
            <p>Cargando cursos...</p>
          ) : cursos.length > 0 ? (
            <div className="cursos-list">
              {cursos.map(curso => (
                <div className="curso-card" key={curso.id} onClick={() => navigate(`/cursos/${curso.id}`)}>
                  <h3>{curso.titulo}</h3>
                  <p>{curso.descripcion}</p>
                  <p>Precio: ${curso.precio}</p>
                  <div className="progress-bar">
                    <div className="progress" style={{ width: `${curso.progreso}%` }}></div>
                  </div>
                  <p>{curso.progreso}% completado</p>
                </div>
              ))}
            </div>
          ) : (
            <p>No hay cursos disponibles en este momento.</p>
          )}
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default Home;
