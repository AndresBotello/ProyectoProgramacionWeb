import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../CourseList.css';

const CourseList = () => {
  const [cursos, setCursos] = useState([]);
  const [instructores, setInstructores] = useState({});
  const token = localStorage.getItem('token');
  const tipoUsuario = localStorage.getItem('tipo_usuario_id'); // Obtener el tipo de usuario

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener cursos
        const cursosResponse = await fetch('http://localhost:3000/api/cursos/todos', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const cursosData = await cursosResponse.json();
        setCursos(cursosData.data || []);

        // Obtener instructores
        const instructoresResponse = await fetch('http://localhost:3000/api/usuarios/instructores', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const instructoresData = await instructoresResponse.json();

        // Crear un objeto para búsqueda rápida de instructores por ID
        const instructoresMap = {};
        instructoresData.data.data.forEach((instructor) => {
          instructoresMap[instructor.id] = instructor.nombre;
        });
        setInstructores(instructoresMap);
      } catch (error) {
        console.error('Error al obtener los datos:', error.message);
      }
    };

    fetchData();
  }, [token]);

  const formatearFecha = (fecha) => {
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return new Date(fecha).toLocaleDateString('es-ES', options);
  };

  const handleDelete = async (cursoId) => {
    const confirmDelete = window.confirm('¿Estás seguro de que deseas eliminar este curso?');
    if (confirmDelete) {
      try {
        const response = await fetch(`http://localhost:3000/api/cursos/${cursoId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Error al eliminar el curso');
        }

        setCursos(cursos.filter((curso) => curso.id !== cursoId));
        alert('Curso eliminado correctamente');
      } catch (error) {
        console.error('Error al eliminar el curso:', error.message);
      }
    }
  };

  return (
    <div className="course-list-container">
      <h1>Course Management</h1>
      <table className="course-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Price</th>
            <th>Category</th>
            <th>Average Rating</th>
            <th>Creation Date</th>
            {tipoUsuario === '2' && <th>Instructor</th>}
            {tipoUsuario === '2' && <th>Accions</th>}
          </tr>
        </thead>
        <tbody>
          {cursos.length > 0 ? (
            cursos.map((curso) => (
              <tr key={curso.id}>
                <td>{curso.titulo}</td>
                <td>{curso.precio}</td>
                <td>{curso.categoria}</td>
                <td>{curso.calificacion_promedio}</td>
                <td>{formatearFecha(curso.fecha_creacion)}</td>
                {tipoUsuario === '2' && (
                  <>
                    <td>{instructores[curso.instructor_id] || 'No asignado'}</td>
                    <td>
                      <Link to={`/cursos/editar/${curso.id}`} className="btn-edit">Editar</Link>
                      <button onClick={() => handleDelete(curso.id)} className="btn-delete">Eliminar</button>
                    </td>
                  </>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={tipoUsuario === '2' ? 7 : 5}>No se encontraron cursos</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CourseList;
