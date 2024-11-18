import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../InstructorAccess.css';
import Footer from './Footer';
import Mensajeria from './Mensajeria'; // Importa el componente Mensajeria

const InstructorAccess = () => {
  const [nombreUsuario, setNombreUsuario] = useState(localStorage.getItem('nombre') || 'Usuario');
  const [emailUsuario, setEmailUsuario] = useState(localStorage.getItem('correo') || 'Correo');
  const [imagenPerfil, setImagenPerfil] = useState(localStorage.getItem('imagen_perfil') || 'https://via.placeholder.com/150');
  const [isEditing, setIsEditing] = useState(false);
  const [newNombre, setNewNombre] = useState(nombreUsuario);
  const [newCorreo, setNewCorreo] = useState(emailUsuario);
  const [newImagen, setNewImagen] = useState(null);
  const [mostrarMensajeria, setMostrarMensajeria] = useState(false);  // Estado para controlar la visibilidad de la mensajería
  const token = localStorage.getItem('token');
  const usuarioId = localStorage.getItem('id');
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

    const correo = localStorage.getItem('correo') || 'Correo';
    const nombre = localStorage.getItem('nombre') || 'Usuario';
    const imagen = localStorage.getItem('imagen_perfil') || 'https://via.placeholder.com/150';

    setNombreUsuario(nombre);
    setEmailUsuario(correo);
    setImagenPerfil(imagen);

  }, [navigate, token]);

  return (
    <div className="user-profile-container">
      <div className="profile-banner">
        <div className="header-left">
          <h1>Bienvenido a MaraLeSte</h1>
          <p className="banner-subtitle">Tu plataforma de cursos de arte</p>
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
          <p>{emailUsuario}</p>
          <p>¡Sigue aprendiendo con tus cursos!</p>
          <button className="btn-edit-profile" onClick={handleEditProfile}>Editar Perfil</button>
          <button className="btn-mensajeria" onClick={() => setMostrarMensajeria(!mostrarMensajeria)}>Ir a Mensajería</button>
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

      {mostrarMensajeria && <Mensajeria />}

      <aside className="buttons-container">
        <button className="btn btn-info" onClick={() => navigate('/lista-cursos')}>Lista de Cursos</button>
        <button className="btn btn-warning" onClick={() => navigate('/usuarios-listinst')}>Lista de Usuarios</button>
        <button className="btn btn-evaluaciones" onClick={() => navigate('/crear-evaluaciones')}>Crear Evaluaciones</button>
      </aside>

      <Footer />
    </div>
  );
};

export default InstructorAccess;
