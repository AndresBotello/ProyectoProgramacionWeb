import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { X } from 'lucide-react';
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
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [certificateUrl, setCertificateUrl] = useState(null);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [isGeneratingCertificate, setIsGeneratingCertificate] = useState(false);
  const [certificateError, setCertificateError] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [ratingError, setRatingError] = useState('');
  const usuario_id = localStorage.getItem('id');
  const token = localStorage.getItem('token');

  useEffect(() => {
    const savedEvaluationStatus = localStorage.getItem(`evaluation_submitted_${courseId}`);
    const savedScore = localStorage.getItem(`evaluation_score_${courseId}`);
    const fetchStudentName = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/usuarios/${usuario_id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) throw new Error('Error al obtener datos del usuario');
        
        const data = await response.json();
        setStudentName(data.data.nombre); // Adjust according to your API response structure
      } catch (error) {
        console.error('Error fetching student name:', error);
      }
    };

    
    if (savedEvaluationStatus === 'true' && savedScore) {
      setEvaluationSubmitted(true);
      setScore(JSON.parse(savedScore));
    }
    fetchStudentName();
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

  const loadProgressFromDB = async () => {
    try {
        const response = await fetch(
            `http://localhost:3000/api/cursos/progreso/${usuario_id}/${courseId}`,
            {
                headers: { 'Authorization': `Bearer ${token}` }
            }
        );
        if (!response.ok) throw new Error('Error al cargar progreso');
        const data = await response.json();
        setCompletedLessons(data.data);
    } catch (error) {
        console.error('Error al cargar progreso:', error);
    } finally {
        setIsLoadingProgress(false);
    }
  };

  const loadProgress = (lecciones) => {
      const savedProgress = JSON.parse(localStorage.getItem(`progress_${courseId}`)) || [];
      const completed = lecciones
        .filter((leccion) => savedProgress.includes(leccion.id))
        .map((leccion) => leccion.id);
      setCompletedLessons(completed);
  };

    // Modificar handleLessonClick para guardar en la base de datos
  const handleLessonClick = async (lessonId) => {
      if (!completedLessons.includes(lessonId)) {
          try {
              await fetch('http://localhost:3000/api/cursos/progreso', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({
                      usuario_id,
                      curso_id: courseId,
                      leccion_id: lessonId
                  })
              });

              const updatedCompleted = [...completedLessons, lessonId];
              setCompletedLessons(updatedCompleted);
              
              // Mantener localStorage como respaldo
              localStorage.setItem(`progress_${courseId}`, JSON.stringify(updatedCompleted));
          } catch (error) {
              console.error('Error al guardar progreso:', error);
          }
      }
  };

  const handleCertificateGeneration = async () => {
    setIsGeneratingCertificate(true);
    setCertificateError(null);
  
    const storedName = localStorage.getItem('nombre');
    const nameToUse = studentName || storedName || 'Estudiante';
  
    try {
      const certificateResponse = await fetch('http://localhost:3000/api/certificar/generar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          usuario_id: usuario_id,
          curso_id: courseId,
          nombre: nameToUse,
          nombre_curso: curso?.titulo
        })
      });
  
      if (!certificateResponse.ok) {
        throw new Error('Error al generar el certificado');
      }
  
      const certificateData = await certificateResponse.json();
  
      if (certificateData.success) {
        // Change this line to use the full URL
        setCertificateUrl(`http://localhost:3000${certificateData.data.certificadoUrl}`);
      } else {
        throw new Error(certificateData.message || 'Error al generar el certificado');
      }
    } catch (error) {
      console.error('Error generating certificate:', error);
      setCertificateError(error.message || 'Error al generar el certificado');
    } finally {
      setIsGeneratingCertificate(false);
    }
  };


  const handleSubmitRating = async () => {
    // Validación de calificación
    if (rating === 0) {
      setRatingError('Por favor selecciona una calificación');
      return;
    }

    setRatingError('');
    setIsSubmittingRating(true);
    try {
      // Asegurarse de que el endpoint es correcto y el token está presente
      if (!token) {
        throw new Error('No se encontró el token de autenticación');
      }

      const response = await fetch(`http://localhost:3000/api/cursos/${courseId}/calificaciones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          usuario_id: parseInt(usuario_id), // Asegurarse de que usuario_id sea un número
          curso_id: parseInt(courseId),     // Asegurarse de que courseId sea un número
          calificacion: parseInt(rating),   // Asegurarse de que rating sea un número
          comentario: comment.trim() || null  // Eliminar espacios en blanco innecesarios
        })
      });

      // Verificar si la respuesta es JSON antes de intentar parsearla
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // Si no es JSON, obtener el texto de la respuesta para debugging
        const textResponse = await response.text();
        console.error('Respuesta no JSON:', textResponse);
        throw new Error('El servidor no respondió con JSON');
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al enviar la calificación');
      }

      if (data.success) {
        setShowRatingModal(false);
        setSuccessMessage('¡Gracias por tu calificación! Tu opinión nos ayuda a mejorar.');
        
        // Opcional: cerrar el modal después de un tiempo
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } else {
        throw new Error(data.message || 'Error al procesar la calificación');
      }
    } catch (error) {
      console.error('Error al enviar calificación:', error);
      setRatingError(error.message || 'Error al enviar la calificación. Por favor intente nuevamente.');
    } finally {
      setIsSubmittingRating(false);
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

        await loadProgressFromDB();
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

  const RatingModal = () => (
    <div className="rating-modal">
      <div className="rating-content relative">
        <button
          onClick={() => setShowRatingModal(false)}
          className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full"
          aria-label="Cerrar modal"
        >
          <X size={18} />
        </button>

        <h3 className="text-xl font-semibold mb-4">Congratulations on completing the course!</h3>
        
        {/* Sección de Certificado */}
        <div className="mb-6">
          {certificateError ? (
            <div className="text-red-600 mb-4">
              <p>{certificateError}</p>
              <button 
                onClick={handleCertificateGeneration}
                disabled={isGeneratingCertificate}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {isGeneratingCertificate ? 'Generando...' : 'Intentar nuevamente'}
              </button>
            </div>
          ) : certificateUrl ? (
            <div className="text-center">
              <p className="text-green-600 mb-2">Your certificate is ready!</p>
              <a
                href={certificateUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Download Certificate
              </a>
            </div>
          ) : (
            <div className="text-center">
              <p>Generating your certificate...</p>
              <div className="loading-spinner"></div>
            </div>
          )}
        </div>

        {/* Sección de Calificación */}
        <div className="rating-section">
          <h4 className="text-lg font-medium mb-2">Rate your experience with the course</h4>
          
          {successMessage && (
            <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">
              {successMessage}
            </div>
          )}
          
          <div className="stars-container mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                className={`star-button ${rating >= star ? 'active' : ''}`}
                onClick={() => setRating(star)}
                disabled={isSubmittingRating}
                aria-label={`Calificar ${star} estrellas`}
              >
                ★
              </button>
            ))}
          </div>
          
          {ratingError && (
            <p className="text-red-600 mb-4">{ratingError}</p>
          )}

          <textarea
            className="w-full p-3 border rounded-md mb-4"
            placeholder="Comparte tu opinión sobre el curso (opcional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={isSubmittingRating}
            maxLength={500}
            rows={4}
          />
          
          <div className="flex justify-end gap-4">
            <button 
              onClick={() => setShowRatingModal(false)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md"
              disabled={isSubmittingRating}
            >
              Close
            </button>
            <button 
              onClick={handleSubmitRating}
              disabled={isSubmittingRating || rating === 0}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:bg-gray-400"
            >
              {isSubmittingRating ? 'Sending...' : 'Submit rating'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  return (
    <div className="course-detail-layout">
      <aside className="course-sidebar">
        <h2>Course outline</h2>
        <input type="text" placeholder="Search course outline" />
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
          <p>Loading course...</p>
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
              <h3>Course progress</h3>
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
                            Your browser does not support video.
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
                <p>There are no lessons available for this course.</p>
              )}
            </section>

            {evaluacion && (
              <section className="course-evaluation">
                <h2>Course Evaluation</h2>
                {!isFullyCompleted() ? (
                  <div className="evaluation-locked">
                    <p className="evaluation-notice">
                      To access the evaluation, you must complete 100% of the course.
                      Current progress: {Math.round(calculateProgress())}%
                    </p>
                  </div>
                ) : !evaluacionDisponible ? (
                  <div className="evaluation-results">
                    <h3>Evaluation already submitted</h3>
                    {score && (
                      <p>
                        Score obtained: {score.score.toFixed(1)}%
                        ({score.correctAnswers} de {score.totalQuestions} corrects)
                      </p>
                    )}
                    <p className="evaluation-notice">
                     This evaluation has already been completed and cannot be submitted again.
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
                        {isSubmitting ? 'Sending...' : 'Send evaluation'}
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}

            {evaluacion && evaluationSubmitted && score && score.score >= 70 && (
              <section className="course-completion">
                <h3>Congratulations! You have passed the course</h3>
                
                {!showRatingModal && (
                  <button 
                    onClick={() => {
                      handleCertificateGeneration();
                      setShowRatingModal(true);
                    }} 
                    className="certificate-button"
                  >
                    Get Certificate
                  </button>
                )}
              </section>
            )}

            {showRatingModal && <RatingModal />}
          </>
        ) : (
          <p>Course information could not be loaded.</p>
        )}
      </main>
    </div>
  );
};

export default CourseDetail;