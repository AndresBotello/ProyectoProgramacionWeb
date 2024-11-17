import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../EvaluationCreate.css';

const EvaluationCreate = () => {
  const [evaluacion, setEvaluacion] = useState({
    titulo: '',
    curso_id: '',
    tipo_evaluacion_id: '', // Changed from tipo_evaluacion to tipo_evaluacion_id
    fecha_inicio: '',
    fecha_fin: ''
  });

  const [cursos, setCursos] = useState([]);
  const [tiposPregunta, setTiposPregunta] = useState([]);
  const [tiposEvaluacion, setTiposEvaluaciones] = useState([]);
  const [preguntas, setPreguntas] = useState([{
    pregunta: '',
    tipo: '',
    opciones: ['', '', '', ''],
    respuestaCorrecta: 0,
    respuestaTexto: ''
  }]);

  const [isUploading, setIsUploading] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');

  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cursosRes = await fetch('http://localhost:3000/api/cursos/todos', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const cursosData = await cursosRes.json();
        setCursos(cursosData.data || []);

        const tiposEvaluacionRes = await fetch('http://localhost:3000/api/evaluaciones/tipos', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const tipoEvaluacionData = await tiposEvaluacionRes.json();
        setTiposEvaluaciones(tipoEvaluacionData.data || []);
  
        const tiposPreguntaRes = await fetch('http://localhost:3000/api/evaluaciones/tipos-preguntas', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const tipoPreguntaData = await tiposPreguntaRes.json();
        setTiposPregunta(tipoPreguntaData.data || []);
      } catch (error) {
        console.error('Error al cargar los datos:', error);
      }
    };
  
    fetchData();
  }, [token]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEvaluacion({ ...evaluacion, [name]: value });
  };

  const handlePreguntaChange = (index, e) => {
    const { name, value } = e.target;
    const nuevasPreguntas = [...preguntas];
    nuevasPreguntas[index][name] = value;

    if (name === "tipo" && value === "Opción múltiple") {
      nuevasPreguntas[index].opciones = ['', ''];
    }
    
    setPreguntas(nuevasPreguntas);
  };

  const handleOpcionChange = (preguntaIndex, opcionIndex, e) => {
    const nuevasPreguntas = [...preguntas];
    nuevasPreguntas[preguntaIndex].opciones[opcionIndex] = e.target.value;
    setPreguntas(nuevasPreguntas);
  };

  const addPregunta = () => {
    if (preguntas.length < 10) {
      setPreguntas([
        ...preguntas,
        {
          pregunta: '',
          tipo: '',
          opciones: ['', '', '', ''],
          respuestaCorrecta: 0,
          respuestaTexto: ''
        }
      ]);
    } else {
      alert('Solo puedes agregar hasta 10 preguntas');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);

    // Validación básica
    if (!evaluacion.titulo || !evaluacion.curso_id || !evaluacion.tipo_evaluacion_id) {
      alert('Por favor complete todos los campos requeridos');
      setIsUploading(false);
      return;
    }

    try {
      // Crear la evaluación
      const evaluacionResponse = await fetch('http://localhost:3000/api/evaluaciones/crear-evaluaciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          titulo: evaluacion.titulo,
          curso_id: evaluacion.curso_id,
          tipo_evaluacion_id: evaluacion.tipo_evaluacion_id
        })
      });

      if (!evaluacionResponse.ok) throw new Error('Error al crear la evaluación');

      const evaluacionData = await evaluacionResponse.json();
      const evaluacionId = evaluacionData.data.evaluacionId;

      // Procesar cada pregunta
      for (const pregunta of preguntas) {
        if (!pregunta.pregunta || !pregunta.tipo) continue;

        // Encontrar el ID del tipo de pregunta
        const tipoPreguntaObj = tiposPregunta.find(t => t.tipo === pregunta.tipo);
        if (!tipoPreguntaObj) continue;

        const preguntaResponse = await fetch('http://localhost:3000/api/evaluaciones/preguntas', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            evaluacion_id: evaluacionId,
            pregunta: pregunta.pregunta,
            tipo_pregunta_id: tipoPreguntaObj.id,
            puntos: 5
          })
        });

        if (!preguntaResponse.ok) {
          throw new Error('Error al crear la pregunta');
        }

        const preguntaData = await preguntaResponse.json();
        const preguntaId = preguntaData.data.preguntaId;

        // Procesar opciones según el tipo de pregunta
        if (pregunta.tipo === 'Opción múltiple') {
          for (let i = 0; i < pregunta.opciones.length; i++) {
            if (!pregunta.opciones[i]) continue;
            
            await fetch('http://localhost:3000/api/evaluaciones/opciones', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                pregunta_id: preguntaId,
                opcion: pregunta.opciones[i],
                es_correcta: parseInt(pregunta.respuestaCorrecta) === i
              })
            });
          }
        } else if (pregunta.tipo === 'Verdadero/Falso') {
          await fetch('http://localhost:3000/api/evaluaciones/opciones', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              pregunta_id: preguntaId,
              opcion: 'Verdadero',
              es_correcta: parseInt(pregunta.respuestaCorrecta) === 1
            })
          });

          await fetch('http://localhost:3000/api/evaluaciones/opciones', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              pregunta_id: preguntaId,
              opcion: 'Falso',
              es_correcta: parseInt(pregunta.respuestaCorrecta) === 0
            })
          });
        }
      }

      setMensajeExito('Evaluación creada exitosamente');
      setTimeout(() => {
        navigate('/evaluaciones');
      }, 2000);

    } catch (error) {
      console.error('Error:', error);
      setMensajeExito('Error al crear la evaluación');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="evaluation-create-container">
      <h1>Crear Nueva Evaluación</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Título de la Evaluación</label>
          <input 
            type="text" 
            name="titulo" 
            value={evaluacion.titulo} 
            onChange={handleChange} 
            required 
          />
        </div>

        <div>
          <label>Tipo de Evaluación</label>
          <select 
            name="tipo_evaluacion_id" 
            value={evaluacion.tipo_evaluacion_id} 
            onChange={handleChange}
            required
          >
            <option value="">Seleccionar Tipo</option>
            {tiposEvaluacion.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.tipo}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Curso</label>
          <select 
            name="curso_id" 
            value={evaluacion.curso_id} 
            onChange={handleChange} 
            required
          >
            <option value="">Seleccionar Curso</option>
            {cursos.map((curso) => (
              <option key={curso.id} value={curso.id}>
                {curso.titulo}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Fecha de Inicio</label>
          <input 
            type="date" 
            name="fecha_inicio" 
            value={evaluacion.fecha_inicio} 
            onChange={handleChange} 
            required 
          />
        </div>

        <div>
          <label>Fecha de Fin</label>
          <input 
            type="date" 
            name="fecha_fin" 
            value={evaluacion.fecha_fin} 
            onChange={handleChange} 
            required 
          />
        </div>

        <h2>Preguntas</h2>
        {preguntas.map((pregunta, index) => (
          <div key={index} className="pregunta-container">
            <div>
              <label>Pregunta {index + 1}</label>
              <input 
                type="text" 
                name="pregunta" 
                value={pregunta.pregunta} 
                onChange={(e) => handlePreguntaChange(index, e)} 
                required 
              />
            </div>

            <div>
              <label>Tipo de Pregunta</label>
              <select 
                name="tipo" 
                value={pregunta.tipo} 
                onChange={(e) => handlePreguntaChange(index, e)}
                required
              >
                <option value="">Seleccionar Tipo</option>
                {tiposPregunta.map((tipo) => (
                  <option key={tipo.id} value={tipo.tipo}>
                    {tipo.tipo}
                  </option>
                ))}
              </select>
            </div>

            {pregunta.tipo === 'Opción múltiple' && (
              <>
                <div>
                  <label>Opciones de Respuesta</label>
                  {pregunta.opciones.map((opcion, i) => (
                    <div key={i}>
                      <input
                        type="text"
                        value={opcion}
                        onChange={(e) => handleOpcionChange(index, i, e)}
                        placeholder={`Opción ${i + 1}`}
                        required
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <label>Respuesta Correcta</label>
                  <select
                    name="respuestaCorrecta"
                    value={pregunta.respuestaCorrecta}
                    onChange={(e) => handlePreguntaChange(index, e)}
                    required
                  >
                    <option value="">Seleccionar opción correcta</option>
                    {pregunta.opciones.map((_, i) => (
                      <option key={i} value={i}>Opción {i + 1}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {pregunta.tipo === 'Verdadero/Falso' && (
              <div>
                <label>Respuesta Correcta</label>
                <select
                  name="respuestaCorrecta"
                  value={pregunta.respuestaCorrecta}
                  onChange={(e) => handlePreguntaChange(index, e)}
                  required
                >
                  <option value="">Seleccionar respuesta</option>
                  <option value="0">Falso</option>
                  <option value="1">Verdadero</option>
                </select>
              </div>
            )}

            {(pregunta.tipo === 'Ensayo' || pregunta.tipo === 'Actividad práctica') && (
              <div>
                <label>Instrucciones</label>
                <textarea
                  name="respuestaTexto"
                  value={pregunta.respuestaTexto}
                  onChange={(e) => handlePreguntaChange(index, e)}
                  placeholder="Escriba las instrucciones para esta pregunta"
                  required
                />
              </div>
            )}
          </div>
        ))}

        <button type="button" onClick={addPregunta} className="btn-secondary">
          Agregar Pregunta
        </button>
        
        <button type="submit" disabled={isUploading} className="btn-primary">
          {isUploading ? 'Creando...' : 'Crear Evaluación'}
        </button>
      </form>

      {mensajeExito && (
        <div className={mensajeExito.includes('Error') ? 'error-message' : 'success-message'}>
          {mensajeExito}
        </div>
      )}
    </div>
  );
};

export default EvaluationCreate;