import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../CourseEdit.css';

const EditCourse = () => {
  const { id } = useParams(); // Obtener el ID del curso de la URL
  const [curso, setCurso] = useState({
    titulo: '',
    descripcion: '',
    contenido: '',
    precio: ''
  });
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    // Cargar el curso específico para editar
    const fetchCurso = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/cursos/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        // Verifica la estructura de la respuesta de la API
        console.log(data); // Verificar qué devuelve la API
        
        if (data && data.curso) {
          setCurso({
            titulo: data.curso.titulo || '',
            descripcion: data.curso.descripcion || '',
            contenido: data.curso.contenido || '',
            precio: data.curso.precio || ''
          });
        } else if (data) {
          // Si el curso no está envuelto en un objeto "curso", prueba así
          setCurso({
            titulo: data.titulo || '',
            descripcion: data.descripcion || '',
            contenido: data.contenido || '',
            precio: data.precio || ''
          });
        }
      } catch (error) {
        console.error('Error al cargar el curso:', error.message);
      }
    };

    fetchCurso();
  }, [id, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurso({ ...curso, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`https://b8fc-186-80-54-78.ngrok-free.app/api/cursos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(curso)
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el curso');
      }

      alert('Curso actualizado correctamente');
      navigate('/cursos');
    } catch (error) {
      console.error('Error al actualizar el curso:', error.message);
    }
  };

  return (
    <div className="course-edit-container">
      <h1>Editar Curso</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Título del Curso</label>
          <input type="text" name="titulo" value={curso.titulo} onChange={handleChange} required />
        </div>
        <div>
          <label>Descripción</label>
          <textarea name="descripcion" value={curso.descripcion} onChange={handleChange} required />
        </div>
        <div>
          <label>Contenido</label>
          <textarea name="contenido" value={curso.contenido} onChange={handleChange} required />
        </div>
        <div>
          <label>Precio</label>
          <input type="number" name="precio" value={curso.precio} onChange={handleChange} required />
        </div>
        <button type="submit">Actualizar Curso</button>
      </form>
    </div>
  );
};

export default EditCourse;
