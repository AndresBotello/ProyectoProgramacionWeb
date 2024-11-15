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
  const [evaluacion, setEvaluacion] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [evaluationSubmitted, setEvaluationSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const token = localStorage.getItem('token');

  const loadProgress = (lecciones) => {
    const savedProgress = JSON.parse(localStorage.getItem(`progress_${courseId}`)) || [];
    const completed = lecciones
      .filter((leccion) => savedProgress.includes(leccion.id))
      .map((leccion) => leccion.id);
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

  const handleAnswerSelection = (preguntaId, opcionId) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [preguntaId]: opcionId,
    }));
  };

  const calculateScore = () => {
    let correctAnswers = 0;
    let totalQuestions = evaluacion.preguntas.length;

    evaluacion.preguntas.forEach((pregunta) => {
      const selectedOptionId = selectedAnswers[pregunta.id];
      const correctOption = pregunta.opciones.find((opcion) => opcion.es_correcta);

      if (selectedOptionId === correctOption?.id) {
        correctAnswers++;
      }
    });

    return {
      score: (correctAnswers / totalQuestions) * 100,
      correctAnswers,
      totalQuestions,
    };
  };

  const handleSubmitEvaluation = () => {
    const result = calculateScore();
    setScore(result);
    setEvaluationSubmitted(true);
  };

  const organizarEvaluacion = (data) => {
    if (!Array.isArray(data) || data.length === 0) return null;

    const evaluacionOrganizada = {
      id: data[0]?.evaluacion_id,
      titulo: data[0]?.evaluacion_titulo,
      preguntas: {},
    };

    data.forEach((item) => {
      if (!evaluacionOrganizada.preguntas[item.pregunta_id]) {
        evaluacionOrganizada.preguntas[item.pregunta_id] = {
          id: item.pregunta_id,
          texto: item.pregunta_texto,
          opciones: [],
        };
      }

      if (item.opcion_id) {
        evaluacionOrganizada.preguntas[item.pregunta_id].opciones.push({
          id: item.opcion_id,
          texto: item.opcion_texto,
          es_correcta: item.opcion_correcta === 1,
        });
      }
    });

    return {
      ...evaluacionOrganizada,
      preguntas: Object.values(evaluacionOrganizada.preguntas),
    };
  };

  useEffect(() => {
    const fetchCurso = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`http://localhost:3000/api/cursos/${courseId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Error al obtener el curso');

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

    const fetchEvaluacion = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/evaluaciones/evaluacion-curso/${courseId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
        const data = await response.json();

        if (!response.ok) {
          setEvaluacion(null); // No hay evaluación disponible
        } else if (data.data && Array.isArray(data.data) && data.data.length > 0) {
          const evaluacionOrganizada = organizarEvaluacion(data.data);
          setEvaluacion(evaluacionOrganizada || null);
        }
      } catch (error) {
        console.error('Error al obtener la evaluación:', error);
        setError('Error al obtener la evaluación: ' + error.message);
      }
    };

    fetchCurso();
    fetchEvaluacion();
  }, [courseId, token]);

  return (
    <div className="course-detail-layout">
      <aside className="course-sidebar">
        <h2>Esquema del curso</h2>
        <input type="text" placeholder="Buscar esquema del curso" />
        <ul>
          {lecciones.map((leccion) => (
            <li key={leccion.id} className={completedLessons.includes(leccion.id) ? 'completed' : ''}>
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
          <p className="error-message">{error}</p>
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
                    <li
                      id={`leccion-${leccion.id}`}
                      key={leccion.id}
                      className={completedLessons.includes(leccion.id) ? 'lesson completed' : 'lesson'}
                    >
                      <h3>{leccion.titulo}</h3>
                      <p>{leccion.contenido || 'Sin descripción'}</p>

                      {leccion.video_url && (
                        <div className="media-container">
                          <video controls className="media-item">
                            <source src={leccion.video_url} type="video/mp4" />
                            Tu navegador no soporta el video.
                          </video>
                        </div>
                      )}

                      {leccion.imagen_url && (
                        <div className="media-container">
                          <img src={leccion.imagen_url} alt={leccion.titulo} className="media-item" />
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No hay lecciones disponibles para este curso.</p>
              )}
            </section>

            {evaluacion && (
              <section className="course-evaluation">
                <h2>Evaluación del Curso</h2>
                {evaluationSubmitted ? (
                  <div>
                    <h3>Resultado:</h3>
                    <p>
                      Puntaje: {score?.score}% ({score?.correctAnswers} de {score?.totalQuestions} correctas)
                    </p>
                  </div>
                ) : (
                  <div>
                    {evaluacion.preguntas.map((pregunta) => (
                      <div key={pregunta.id}>
                        <h4>{pregunta.texto}</h4>
                        {pregunta.opciones.map((opcion) => (
                          <label key={opcion.id}>
                            <input
                              type="radio"
                              name={`pregunta-${pregunta.id}`}
                              value={opcion.id}
                              onChange={() => handleAnswerSelection(pregunta.id, opcion.id)}
                            />
                            {opcion.texto}
                          </label>
                        ))}
                      </div>
                    ))}
                    <button onClick={handleSubmitEvaluation}>Enviar evaluación</button>
                  </div>
                )}
              </section>
            )}
          </>
        ) : (
          <p>No se pudo cargar la información del curso.</p>
        )}
      </main>
    </div>
  );
};

export default CourseDetail;
