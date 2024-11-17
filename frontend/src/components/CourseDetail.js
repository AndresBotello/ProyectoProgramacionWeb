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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluationError, setEvaluationError] = useState(null);
  const [evaluacionDisponible, setEvaluacionDisponible] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const savedEvaluationStatus = localStorage.getItem(`evaluation_submitted_${courseId}`);
    const savedScore = localStorage.getItem(`evaluation_score_${courseId}`);
    
    if (savedEvaluationStatus === 'true' && savedScore) {
      setEvaluationSubmitted(true);
      setScore(JSON.parse(savedScore));
    }
  }, [courseId]);

  const verificarEstadoEvaluacion = async (evaluacionId) => {
    try {
      const usuario_id = localStorage.getItem('id');
      const response = await fetch(
        `http://localhost:3000/api/evaluaciones/verificar-estado/${evaluacionId}?usuario_id=${usuario_id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Error al verificar el estado de la evaluación');
      }
      
      const data = await response.json();
      
      if (data.data.evaluacionPresentada) {
        setEvaluationSubmitted(true);
        setEvaluacionDisponible(false);
        const savedScore = localStorage.getItem(`evaluation_score_${courseId}`);
        if (savedScore) {
          setScore(JSON.parse(savedScore));
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setEvaluationError('Error al verificar el estado de la evaluación');
    }
  };

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

  const isFullyCompleted = () => {
    return calculateProgress() === 100;
  };

  const handleAnswerSelection = (preguntaId, opcionId) => {
    if (evaluationSubmitted) return;
    
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

  const validateAnswers = () => {
    return evaluacion.preguntas.every(pregunta => selectedAnswers[pregunta.id] !== undefined);
  };

  const handleSubmitEvaluation = async () => {
    if (evaluationSubmitted) {
      setEvaluationError('Esta evaluación ya ha sido enviada y no puede modificarse.');
      return;
    }

    if (!validateAnswers()) {
      setEvaluationError('Por favor responde todas las preguntas antes de enviar.');
      return;
    }

    setIsSubmitting(true);
    setEvaluationError(null);

    try {
      const usuario_id = localStorage.getItem('id');
      if (!usuario_id) {
        setEvaluationError('No se pudo obtener el ID del usuario. Asegúrate de haber iniciado sesión.');
        return;
      }

      const result = calculateScore();
      
      localStorage.setItem(`evaluation_submitted_${courseId}`, 'true');
      localStorage.setItem(`evaluation_score_${courseId}`, JSON.stringify(result));
      
      setScore(result);
      setEvaluationSubmitted(true);
      setEvaluacionDisponible(false);

      const submissionPromises = evaluacion.preguntas.map(async (pregunta) => {
        const selectedOptionId = selectedAnswers[pregunta.id];
        const correctOption = pregunta.opciones.find(opcion => opcion.es_correcta);
        const calificacion = selectedOptionId === correctOption?.id ? 1 : 0;

        const response = await fetch('http://localhost:3000/api/evaluaciones/respuesta-usuario', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            usuario_id,
            evaluacion_id: evaluacion.id,
            pregunta_id: pregunta.id,
            opcion_seleccionada: selectedOptionId,
            calificacion
          })
        });

        if (!response.ok) {
          throw new Error('Error al enviar la respuesta');
        }

        return response.json();
      });

      await Promise.all(submissionPromises);
    } catch (error) {
      setEvaluationError('Error al enviar la evaluación. Por favor intente nuevamente.');
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
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
          headers: { Authorization: `Bearer ${token}` },
        });
    
        if (!response.ok) throw new Error('Error al obtener la evaluación');
    
        const data = await response.json();
    
        if (data.data && Array.isArray(data.data) && data.data.length > 0) {
          const evaluacionOrganizada = organizarEvaluacion(data.data);
          setEvaluacion(evaluacionOrganizada || null);
    
          if (evaluacionOrganizada) {
            await verificarEstadoEvaluacion(evaluacionOrganizada.id);
          }
        }
      } catch (error) {
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
                {!isFullyCompleted() ? (
                  <div className="evaluation-locked">
                    <p className="evaluation-notice">
                      Para acceder a la evaluación, debes completar el 100% del curso.
                      Progreso actual: {Math.round(calculateProgress())}%
                    </p>
                  </div>
                ) : !evaluacionDisponible ? (
                  <div className="evaluation-results">
                    <h3>Evaluación ya presentada</h3>
                    {score && (
                      <p>
                        Puntaje obtenido: {score.score.toFixed(1)}%
                        ({score.correctAnswers} de {score.totalQuestions} correctas)
                      </p>
                    )}
                    <p className="evaluation-notice">
                      Esta evaluación ya ha sido completada y no puede presentarse nuevamente.
                    </p>
                  </div>
                ) : (
                  <div className="evaluation-form">
                    {evaluacion.preguntas.map((pregunta) => (
                      <div key={pregunta.id} className="question-container">
                        <h4>{pregunta.texto}</h4>
                        <div className="options-container">
                          {pregunta.opciones.map((opcion) => (
                            <label key={opcion.id} className="option-label">
                              <input
                                type="radio"
                                name={`pregunta-${pregunta.id}`}
                                value={opcion.id}
                                onChange={() => handleAnswerSelection(pregunta.id, opcion.id)}
                                checked={selectedAnswers[pregunta.id] === opcion.id}
                                disabled={isSubmitting || evaluationSubmitted}
                              />
                              <span className="option-text">{opcion.texto}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                    {evaluationError && <p className="error-message">{evaluationError}</p>}
                    <div className="evaluation-controls">
                      <button
                        onClick={handleSubmitEvaluation}
                        disabled={isSubmitting || !validateAnswers() || evaluationSubmitted}
                        className="submit-button"
                      >
                        {isSubmitting ? 'Enviando...' : 'Enviar evaluación'}
                      </button>
                    </div>
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