import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import '../CourseDetail.css';

const CourseDetail = () => {
  const { courseId } = useParams();
  const [curso, setCurso] = useState(null);
  const [lecciones, setLecciones] = useState([]);
  const [completedLessons, setCompletedLessons] = useState([]);
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
        loadProgress(data.data.lecciones || []);
      } catch (error) {
        setError('Error al obtener el curso: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurso();
  }, [courseId, token]);

  const loadProgress = (lecciones) => {
    const savedProgress = JSON.parse(localStorage.getItem(`progress_${courseId}`)) || [];
    const completed = lecciones.filter(leccion => savedProgress.includes(leccion.id)).map(leccion => leccion.id);
    setCompletedLessons(completed);
  };

  const handleLessonClick = (lessonId) => {
    if (!completedLessons.includes(lessonId)) {
      const updatedCompleted = [...completedLessons, lessonId];
      setCompletedLessons(updatedCompleted);
      localStorage.setItem(`progress_${courseId}`, JSON.stringify(updatedCompleted));
    }
  };

  const calculateProgress = () => {
    if (lecciones.length === 0) return 0;
    return (completedLessons.length / lecciones.length) * 100;
  };

  return (
    <div className="course-detail-layout">
      <aside className="course-sidebar">
        <h2>Esquema del curso</h2>
        <input type="text" placeholder="Buscar esquema del curso" />
        <ul>
          {lecciones.map((leccion) => (
            <li key={leccion.id} className={completedLessons.includes(leccion.id) ? "completed" : ""}>
              <a href={`#leccion-${leccion.id}`} onClick={() => handleLessonClick(leccion.id)}>
                {leccion.titulo}
              </a>
            </li>
          ))}
        </ul>
      </aside>

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

            <section className="progress-section">
              <h3>Progreso del curso</h3>
              <div className="progress-bar">
                <div className="progress" style={{ width: `${calculateProgress()}%` }}></div>
              </div>
              <p>{Math.round(calculateProgress())}% completado</p>
            </section>

            <section className="course-lessons">
              <h2>Lecciones del Curso</h2>
              {lecciones.length > 0 ? (
                <ul>
                  {lecciones.map((leccion) => (
                    <li id={`leccion-${leccion.id}`} key={leccion.id} className={completedLessons.includes(leccion.id) ? "lesson completed" : "lesson"}>
                      <h3>{leccion.titulo}</h3>
                      <p>{leccion.contenido || 'Sin descripción'}</p>

                      {/* Mostrar video si existe */}
                      {leccion.video_url && (
                        <div className="media-container">
                          <video controls className="media-item">
                            <source src={leccion.video_url} type="video/mp4" />
                            Tu navegador no soporta el video.
                          </video>
                        </div>
                      )}
                      
                      {/* Mostrar imagen si existe y es una URL */}
                      {leccion.imagen_url && (
                        <div className="media-container">
                          <img src={leccion.imagen_url} alt={leccion.titulo} className="media-item" />
                        </div>
                      )}

                      <button onClick={() => handleLessonClick(leccion.id)}>
                        {completedLessons.includes(leccion.id) ? 'Lección Completada' : 'Marcar como Completada'}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No hay lecciones disponibles.</p>
              )}
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
};

export default CourseDetail;
