import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import '../CourseDetail.css'; 

const CourseDetail = () => {
  const { courseId } = useParams();  
  const [curso, setCurso] = useState(null);
  const [lecciones, setLecciones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchCurso = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`http://localhost:3000/api/cursos/${courseId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Error al obtener el curso');
        }

        const data = await response.json();
        setCurso(data.data.curso);  
        setLecciones(data.data.lecciones || []); 
      } catch (error) {
        setError('Error al obtener el curso: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurso();
  }, [courseId, token]);

  return (
    <div className="course-detail-layout">
      {/* Esquema del curso en la barra lateral izquierda */}
      <aside className="course-sidebar">
        <h2>Esquema del curso</h2>
        <input type="text" placeholder="Buscar esquema del curso" />
        <ul>
          {lecciones.map((leccion) => (
            <li key={leccion.id}>
              <a href={`#leccion-${leccion.id}`}>{leccion.titulo}</a>
            </li>
          ))}
        </ul>
      </aside>

      {/* Contenido principal del curso */}
      <main className="course-content">
        {isLoading ? (
          <p>Cargando curso...</p>
        ) : error ? (
          <p>{error}</p>
        ) : curso ? (
          <>
            <div className="course-header">
              <h1>{curso.titulo}</h1>
              <p>{curso.descripcion}</p>
              <p><strong>Contenido:</strong> {curso.contenido}</p>
              <p><strong>Precio:</strong> ${curso.precio}</p>
            </div>

            <section className="course-lessons">
              <h2>Lecciones del Curso</h2>
              {lecciones.length > 0 ? (
                <ul>
                  {lecciones.map((leccion) => (
                    <li id={`leccion-${leccion.id}`} key={leccion.id}>
                      <h3>{leccion.titulo}</h3>
                      <p>{leccion.contenido || 'Sin descripción'}</p>
                      {leccion.video_url && (
                        <p><strong>Video:</strong> <a href={leccion.video_url}>{leccion.video_url}</a></p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No hay lecciones disponibles para este curso.</p>
              )}
            </section>
          </>
        ) : (
          <p>No hay detalles del curso disponibles.</p>
        )}
      </main>
    </div>
  );
};

export default CourseDetail;
