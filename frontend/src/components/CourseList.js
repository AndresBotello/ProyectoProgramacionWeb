import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../CourseList.css';

const CourseList = () => {
  const [cursos, setCursos] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Cargar los cursos al montar el componente
  useEffect(() => {
    const fetchCursos = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/cursos/todos', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setCursos(data.data || []); // Asegura que siempre sea un array
      } catch (error) {
        console.error('Error al obtener los cursos:', error.message);
      }
    };

    fetchCursos();
  }, [token]);

  // Manejar la eliminación del curso
  const handleDelete = async (cursoId) => {
    const confirmDelete = window.confirm('¿Estás seguro de que deseas eliminar este curso?');
    if (confirmDelete) {
      try {
        console.log(`Intentando eliminar el curso con ID: ${cursoId}`);
        const response = await fetch(`http://localhost:3000/api/cursos/${cursoId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
  
        if (!response.ok) {
          throw new Error('Error al eliminar el curso');
        }
  
        // Actualizar la lista de cursos después de la eliminación
        setCursos(cursos.filter(curso => curso.id !== cursoId));
        alert('Curso eliminado correctamente');
      } catch (error) {
        console.error('Error al eliminar el curso:', error.message);
      }
    }
  };
  
  const handleEdit = (cursoId) => {
    console.log(`Editando el curso con ID: ${cursoId}`);
    navigate(`/cursos/editar/${cursoId}`); // Asegúrate de que la ruta tenga el ID del curso
  };
  

  return (
    <div className="course-list-container">
      <h1>Gestión de Cursos</h1>
      <table className="course-table">
        <thead>
          <tr>
            <th>Título</th>
            <th>Descripción</th>
            <th>Precio</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {cursos.length > 0 ? (
            cursos.map((curso) => (
              <tr key={curso.id}>
                <td>{curso.titulo}</td>
                <td>{curso.descripcion}</td>
                <td>{curso.precio}</td>
                <td>
                  <button onClick={() => handleEdit(curso.id)} className="btn-edit">Editar</button>
                  <button onClick={() => handleDelete(curso.id)} className="btn-delete">Eliminar</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4">No se encontraron cursos</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CourseList;
