import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../CourseList.css';

const CourseList = () => {
  const [cursos, setCursos] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchCursos = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/cursos/todos', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setCursos(data.data || []);
      } catch (error) {
        console.error('Error al obtener los cursos:', error.message);
      }
    };

    fetchCursos();
  }, [token]);

  const handleDelete = async (cursoId) => {
    const confirmDelete = window.confirm('¿Estás seguro de que deseas eliminar este curso?');
    if (confirmDelete) {
      try {
        const response = await fetch(`http://localhost:3000/api/cursos/${cursoId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Error al eliminar el curso');
        }

        setCursos(cursos.filter(curso => curso.id !== cursoId));
        alert('Curso eliminado correctamente');
      } catch (error) {
        console.error('Error al eliminar el curso:', error.message);
      }
    }
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
                  <Link to={`/cursos/editar/${curso.id}`} className="btn-edit">Editar</Link>
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
