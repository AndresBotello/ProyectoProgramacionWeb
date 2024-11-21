import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../UserAccessForm.css';
import Footer from './Footer';
import NotificationCenter from './NotificacionesCenter';
import Mensajeria from './Mensajeria';


const UserAccessForm = () => {
  const [cursos, setCursos] = useState([]);
  const [error, setError] = useState(null);
  const [inscripcionExitoso, setInscripcionExitoso] = useState(null);
  const [inscripcionError, setInscripcionError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(''); 
  const [categorias, setCategorias] = useState([]);
  const [niveles, setNiveles] = useState([]);
  const [nombreUsuario, setNombreUsuario] = useState(localStorage.getItem('nombre') || 'Usuario');
  const [emailUsuario, setEmailUsuario] = useState(localStorage.getItem('correo') || 'Correo');
  const [imagenPerfil, setImagenPerfil] = useState(localStorage.getItem('imagen_perfil') || 'https://via.placeholder.com/150');
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [newNombre, setNewNombre] = useState(nombreUsuario);
  const [mostrarMensajeria, setMostrarMensajeria] = useState(false); 
  const [newCorreo, setNewCorreo] = useState(emailUsuario);
  const [newImagen, setNewImagen] = useState(null);
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

    const fetchCursos = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('http://localhost:3000/api/cursos/todos', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const usuarioId = localStorage.getItem('id');
        if (!usuarioId) {
          alert('No se ha encontrado el ID del usuario');
          return;
        }

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

    const fetchCategorias = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/categoriasniveles/categorias', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        setCategorias(data.data || []);
      } catch (error) {
        console.error('Error al obtener categorías:', error);
      }
    };
  
    const fetchNiveles = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/categoriasniveles/niveles', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        setNiveles(data.data || []);
      } catch (error) {
        console.error('Error al obtener niveles:', error);
      }
    };
  

    const correo = localStorage.getItem('correo') || 'Correo';
    const nombre = localStorage.getItem('nombre') || 'Usuario';
    const imagen = localStorage.getItem('imagen_perfil') || 'https://via.placeholder.com/150';

    setNombreUsuario(nombre);
    setEmailUsuario(correo);
    setImagenPerfil(imagen);

    fetchCursos();
    fetchCategorias();
    fetchNiveles();
  }, [navigate, token]);

  const handleInscripcion = async (cursoId) => {
    try {
      const usuarioId = localStorage.getItem('id');
      if (!usuarioId) {
        alert('No se ha encontrado el ID del usuario');
        return;
      }

      const inscripcionData = {
        usuario_id: usuarioId,
        curso_id: cursoId,
      };

      const response = await fetch('http://localhost:3000/api/cursos/inscripciones', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inscripcionData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error al inscribirse en el curso');
      }

      setInscripcionExitoso('Inscripción exitosa en el curso');
      setInscripcionError(null);
      alert('Te has inscrito en el curso correctamente!');
    } catch (error) {
      setInscripcionError(error.message);
      setInscripcionExitoso(null);
      alert('Error al inscribirse en el curso: ' + error.message);
      console.error('Error al intentar inscribirse:', error);
    }
  };

  return (
    <div className="user-profile-container">
      <div className="profile-banner">
        <div className="header-left">
          <h1>Welcome to MaraLeSte</h1>
          <p className="banner-subtitle">Your art course platform</p>
        </div>
        <div className="header-right">
          <NotificationCenter />
          <button className="btn-logout" onClick={handleLogout}>Log out</button>
        </div>
      </div>

      <div className="profile-section">
        <div className="profile-picture">
          <img src={imagenPerfil} alt="Perfil de Usuario" />
        </div>
        <div className="profile-info">
          <h2>{nombreUsuario}</h2>
          <p>{emailUsuario}</p>
          <p>Keep learning with our courses!</p>
          <button className="btn-edit-profile" onClick={handleEditProfile}>Edit Profile</button>
          <button className="btn-mensajeria" onClick={() => setMostrarMensajeria(!mostrarMensajeria)}>Go to Messaging</button>
        </div>
      </div>

      {isEditing && (
        <form onSubmit={handleSaveProfile} className="edit-profile-form">
          <h3>Edit Profile</h3>
          <div>
            <label>Name:</label>
            <input
              type="text"
              value={newNombre}
              onChange={(e) => setNewNombre(e.target.value)}
            />
          </div>
          <div>
            <label>Email:</label>
            <input
              type="email"
              value={newCorreo}
              onChange={(e) => setNewCorreo(e.target.value)}
            />
          </div>
          <div>
            <label>Profile Picture:</label>
            <input
              type="file"
              onChange={handleImageChange}
            />
          </div>
          <button type="submit">Save Changes</button>
          <button type="button" onClick={() => setIsEditing(false)}>Cancel</button>
        </form>
      )}
        {mostrarMensajeria && <Mensajeria />}
        
      <h2 className="filtro">Search available courses</h2>
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search courses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
        <h2>Available Courses</h2>
          {isLoading ? (
            <p>Loading Courses...</p>
          ) : error ? (
            <p>{error}</p>
          ) : cursos.length > 0 ? (
            <div className="cursos-list">
              {cursos
                .filter(curso =>
                  curso.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  curso.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  curso.nivel.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  curso.categoria.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map(curso => {
                  const usuarioId = localStorage.getItem('id'); // Recupera userId
                  return (
                    <div 
                      className="curso-card" 
                      key={curso.id} 
                      onClick={() => navigate(`/cursos/${curso.id}`, { state: { usuarioId } })}
                    >
                      <h3>{curso.titulo}</h3>
                      <p>{curso.descripcion}</p>
                      <p>Category: {curso.categoria}</p>
                      <p>Level: {curso.nivel}</p>
                      <p>Price: ${curso.precio}</p>
                      <button onClick={(e) => {
                        e.stopPropagation(); 
                        handleInscripcion(curso.id);
                      }}>
                        Inscribirme
                      </button>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p>There are no courses available.</p>
          )}
      <Footer />
    </div>
  );
};

export default UserAccessForm;
