import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';  
import '../Home.css'; 
import Footer from './Footer';

const Home = () => {
  const navigate = useNavigate();  
  const [cursos, setCursos] = useState([]);
  const [nombreUsuario, setNombreUsuario] = useState(localStorage.getItem('nombre') || 'Usuario');
  const [emailUsuario, setEmailUsuario] = useState(localStorage.getItem('correo') || 'Correo');
  const [imagenPerfil, setImagenPerfil] = useState(localStorage.getItem('imagen_perfil') || 'https://via.placeholder.com/150');
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [newNombre, setNewNombre] = useState(nombreUsuario);
  const [newCorreo, setNewCorreo] = useState(emailUsuario);
  const [newImagen, setNewImagen] = useState(null);
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
    localStorage.removeItem('imagen_perfil'); // Limpiar también la imagen de perfil
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

  const handleImageChange = (e) => {
    setNewImagen(e.target.files[0]);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const userId = localStorage.getItem('id'); 
    const formData = new FormData();
    formData.append('nombre', newNombre);
    formData.append('correo', newCorreo);
    if (newImagen) {
      formData.append('imagen', newImagen);
    }

    try {
      const response = await fetch(`http://localhost:3000/api/usuarios/perfil/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      // Actualizar los datos del usuario en el estado y en localStorage
      setNombreUsuario(newNombre);
      setEmailUsuario(newCorreo);
      
      if (data.data && data.data.imagen_perfil) {
        setImagenPerfil(data.data.imagen_perfil);
        localStorage.setItem('imagen_perfil', data.data.imagen_perfil);
      }
       
      localStorage.setItem('nombre', newNombre);
      localStorage.setItem('correo', newCorreo);
      alert(data.message);
      setIsEditing(false);
    } catch (error) {
      console.error('Error al actualizar el perfil:', error.message);
      alert('Error al actualizar el perfil: ' + error.message);
    }
  };

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="header-left">
          <h1>Bienvenido a MaraLeSte, {nombreUsuario}</h1> 
          <p className="subtitle">Plataforma de cursos de artes plásticas y dibujo</p>
        </div>
        <div className="header-right">
          <button className="btn-logout" onClick={handleLogout}>Cerrar Sesión</button>
        </div>
      </header>

      <div className="main-content">
        {/* Sección de edición de perfil */}
        <div className="profile-section">
          <div className="profile-picture">
            <img src={imagenPerfil} alt="Perfil de Usuario" />
          </div>
          <div className="profile-info">
            <h2>{nombreUsuario}</h2>
            <p>{emailUsuario}</p> {/* Mostrar el correo */}
            <button className = "btn-editar-datos" onClick={() => setIsEditing(true)}>Editar Datos</button>
          </div>
        </div>

        {isEditing && (
          <form onSubmit={handleSaveProfile} className="edit-profile-form">
            <h3>Editar Perfil</h3>
            <label>Nombre:</label>
            <input 
              type="text" 
              value={newNombre} 
              onChange={(e) => setNewNombre(e.target.value)} 
            />
            <label>Correo:</label>
            <input 
              type="email" 
              value={newCorreo} 
              onChange={(e) => setNewCorreo(e.target.value)} 
            />
            <label>Imagen de Perfil:</label>
            <input 
              type="file" 
              onChange={handleImageChange} 
            />
             <button className="btn-guardar-cambios" type="submit">Guardar Cambios</button>
             <button className="btn-cancelar" type="button" onClick={() => setIsEditing(false)}>Cancelar</button>
          </form>
        )}

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
