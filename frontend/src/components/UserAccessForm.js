import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../UserAccessForm.css';
import Footer from './Footer';

const UserAccessForm = () => {
  const [cursos, setCursos] = useState([]);
  const [error, setError] = useState(null);
  const [nombreUsuario, setNombreUsuario] = useState(localStorage.getItem('nombre') || 'Usuario');
  const [emailUsuario, setEmailUsuario] = useState(localStorage.getItem('correo') || 'Correo');
  const [imagenPerfil, setImagenPerfil] = useState(localStorage.getItem('imagen_perfil') || 'https://via.placeholder.com/150');
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [newNombre, setNewNombre] = useState(nombreUsuario);
  const [newCorreo, setNewCorreo] = useState(emailUsuario);
  const [newImagen, setNewImagen] = useState(null);
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    alert("Sesión cerrada exitosamente");
    navigate('/login');
  };

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleImageChange = (e) => {
    setNewImagen(e.target.files[0]);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const userId = localStorage.getItem('id'); 
    console.log('ID cargado desde localStorage:', userId); 
    if (!userId) {
      alert('No se ha encontrado el ID del usuario');
      return;
    }
  
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
      console.log('Respuesta de la API:', data);
  
      if (!response.ok) throw new Error(data.message);
  
     
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

    const correo = localStorage.getItem('correo') || 'Correo';
    const nombre = localStorage.getItem('nombre') || 'Usuario';
    const imagen = localStorage.getItem('imagen_perfil') || 'https://via.placeholder.com/150';

    console.log('Correo cargado desde localStorage:', correo);
    console.log('Nombre cargado desde localStorage:', nombre);

    setNombreUsuario(nombre);
    setEmailUsuario(correo);
    setImagenPerfil(imagen);

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
          <img src={imagenPerfil} alt="Perfil de Usuario" />
        </div>
        <div className="profile-info">
          <h2>{nombreUsuario}</h2>
          <p>{emailUsuario}</p> {/* Mostrar el correo */}
          <p>¡Sigue aprendiendo con tus cursos!</p>
          <button className="btn-edit-profile" onClick={handleEditProfile}>Editar Perfil</button>
        </div>
      </div>

      {isEditing && (
        <form onSubmit={handleSaveProfile} className="edit-profile-form">
          <h3>Editar Perfil</h3>
          <div>
            <label>Nombre:</label>
            <input
              type="text"
              value={newNombre}
              onChange={(e) => setNewNombre(e.target.value)}
            />
          </div>
          <div>
            <label>Correo:</label>
            <input
              type="email"
              value={newCorreo}
              onChange={(e) => setNewCorreo(e.target.value)}
            />
          </div>
          <div>
            <label>Imagen de Perfil:</label>
            <input
              type="file"
              onChange={handleImageChange}
            />
          </div>
          <button type="submit">Guardar Cambios</button>
          <button type="button" onClick={() => setIsEditing(false)}>Cancelar</button>
        </form>
      )}

      <h2>Cursos Disponibles</h2>
      {isLoading ? (
        <p>Cargando cursos...</p>
      ) : error ? (
        <p>{error}</p>
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
        <p>No hay cursos disponibles.</p>
      )}

      <Footer />
    </div>
  );
};

export default UserAccessForm;
