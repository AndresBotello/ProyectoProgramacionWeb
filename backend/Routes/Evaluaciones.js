const express = require('express');
const router = express.Router();
const evaluacionService = require('../Services/Evaluaciones');

// Ruta para obtener todos los tipos de evaluación
router.get('/tipos', async (req, res) => {
    try {
        const tiposEvaluacion = await evaluacionService.obtenerTiposEvaluacion();
        console.log('Tipos de evaluación obtenidos:', tiposEvaluacion);
        res.status(200).json({ message: 'Tipos de evaluación obtenidos exitosamente', data: tiposEvaluacion });
    } catch (error) {
        console.error('Error al obtener los tipos de evaluación:', error.message);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});


router.get('/tipos-preguntas', async (req, res) => {
    try {
        const tiposEvaluacion = await evaluacionService.obtenerTiposPreguntas();
        console.log('Tipos de preguntas obtenidas:', tiposEvaluacion);
        res.status(200).json({ message: 'Tipos de preguntas obtenidas exitosamente', data: tiposEvaluacion });
    } catch (error) {
        console.error('Error al obtener los tipos de preguntas:', error.message);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

router.post('/crear-evaluaciones', async (req, res) => {
    const { curso_id, titulo, tipo_evaluacion_id } = req.body;
    console.log('Datos recibidos para crear evaluación:', { curso_id, titulo, tipo_evaluacion_id });
    if (!curso_id || !titulo || !tipo_evaluacion_id) {
        return res.status(400).json({ message: 'Faltan campos requeridos' });
    }

    try {
        const nuevaEvaluacion = await evaluacionService.crearEvaluacion({ curso_id, titulo, tipo_evaluacion_id });
        console.log('Evaluación creada:', nuevaEvaluacion);
        res.status(201).json({ message: 'Evaluación creada exitosamente', data: nuevaEvaluacion });
    } catch (error) {
        console.error('Error al crear la evaluación:', error.message); 
        res.status(500).json({ message: 'Error en el servidor', error: error.message });
    }
});

// Ruta para obtener las evaluaciones de un curso
router.get('/obtener-evaluaciones/:curso_id', async (req, res) => {
    const { curso_id } = req.params;
    console.log('Obteniendo evaluaciones para el curso:', curso_id);
    try {
        const evaluaciones = await evaluacionService.obtenerEvaluacionesPorCurso(curso_id);
        console.log('Evaluaciones obtenidas:', evaluaciones);
        res.status(200).json({ message: 'Evaluaciones obtenidas exitosamente', data: evaluaciones });
    } catch (error) {
        console.error('Error al obtener las evaluaciones del curso:', error.message);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Ruta para crear una pregunta
router.post('/preguntas', async (req, res) => {
    const { evaluacion_id, pregunta, tipo_pregunta_id, puntos } = req.body;
    console.log('Datos recibidos para crear pregunta:', { evaluacion_id, pregunta, tipo_pregunta_id, puntos });
    if (!evaluacion_id || !pregunta || !tipo_pregunta_id) {
        return res.status(400).json({ message: 'Faltan campos requeridos' });
    }

    try {
        const nuevaPregunta = await evaluacionService.crearPregunta({ evaluacion_id, pregunta, tipo_pregunta_id, puntos });
        console.log('Pregunta creada:', nuevaPregunta);
        res.status(201).json({ message: 'Pregunta creada exitosamente', data: nuevaPregunta });
    } catch (error) {
        console.error('Error al crear la pregunta:', error.message);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Ruta para obtener las preguntas de una evaluación
router.get('/preguntas/:evaluacion_id', async (req, res) => {
    const { evaluacion_id } = req.params;
    console.log('Obteniendo preguntas para la evaluación:', evaluacion_id);
    try {
        const preguntas = await evaluacionService.obtenerPreguntasPorEvaluacion(evaluacion_id);
        console.log('Preguntas obtenidas:', preguntas);
        res.status(200).json({ message: 'Preguntas obtenidas exitosamente', data: preguntas });
    } catch (error) {
        console.error('Error al obtener las preguntas de la evaluación:', error.message);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Ruta para agregar una opción de respuesta a una pregunta
router.post('/opciones', async (req, res) => {
    const { pregunta_id, opcion, es_correcta } = req.body;
    console.log('Datos recibidos para agregar opción:', { pregunta_id, opcion, es_correcta });
    if (!pregunta_id || !opcion || es_correcta === undefined) {
        return res.status(400).json({ message: 'Faltan campos requeridos' });
    }

    try {
        const pregunta = await evaluacionService.obtenerPreguntaPorId(pregunta_id);
        console.log('Pregunta obtenida para verificar tipo:', pregunta);

        if (!pregunta) {
            return res.status(404).json({ message: 'Pregunta no encontrada' });
        }

        if (pregunta.tipo_pregunta_id === 1) {
            const nuevaOpcion = await evaluacionService.crearOpcion({ pregunta_id, opcion, es_correcta });
            console.log('Opción de respuesta creada:', nuevaOpcion);
            res.status(201).json({ message: 'Opción de respuesta agregada exitosamente', data: nuevaOpcion });
        } else if (pregunta.tipo_pregunta_id === 2) {
            const opcionesActuales = await evaluacionService.obtenerOpcionesPorPregunta(pregunta_id);
            console.log('Opciones actuales de la pregunta de verdadero/falso:', opcionesActuales);
            if (opcionesActuales.length >= 2) {
                return res.status(400).json({ message: 'Las preguntas de verdadero/falso solo pueden tener dos opciones' });
            }
            const nuevaOpcion = await evaluacionService.crearOpcion({ pregunta_id, opcion, es_correcta });
            console.log('Opción de verdadero/falso creada:', nuevaOpcion);
            res.status(201).json({ message: 'Opción de verdadero/falso agregada exitosamente', data: nuevaOpcion });
        } else {
            res.status(400).json({ message: 'Tipo de pregunta no soportado' });
        }
    } catch (error) {
        console.error('Error al agregar la opción de respuesta:', error.message);
        res.status(500).json({ message: 'Error en el servidor', error: error.message });
    }
});

// Ruta para obtener las opciones de una pregunta
router.get('/opciones/:pregunta_id', async (req, res) => {
    const { pregunta_id } = req.params;
    console.log('Obteniendo opciones para la pregunta:', pregunta_id);
    try {
        const opciones = await evaluacionService.obtenerOpcionesPorPregunta(pregunta_id);
        console.log('Opciones obtenidas:', opciones);
        res.status(200).json({ message: 'Opciones obtenidas exitosamente', data: opciones });
    } catch (error) {
        console.error('Error al obtener las opciones de la pregunta:', error.message);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Ruta para que un estudiante responda una pregunta abierta
router.post('/respuestas_abiertas', async (req, res) => {
    const { usuario_id, pregunta_id, respuesta_texto, archivo_url } = req.body;
    console.log('Datos recibidos para respuesta abierta:', { usuario_id, pregunta_id, respuesta_texto, archivo_url });
    if (!usuario_id || !pregunta_id || !respuesta_texto) {
        return res.status(400).json({ message: 'Faltan campos requeridos' });
    }

    try {
        const nuevaRespuesta = await evaluacionService.crearRespuestaAbierta({ usuario_id, pregunta_id, respuesta_texto, archivo_url });
        console.log('Respuesta abierta creada:', nuevaRespuesta);
        res.status(201).json({ message: 'Respuesta abierta enviada exitosamente', data: nuevaRespuesta });
    } catch (error) {
        console.error('Error al enviar la respuesta abierta:', error.message);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});


// Ruta para obtener la evaluación de un curso con sus preguntas y opciones
router.get('/evaluacion-curso/:curso_id', async (req, res) => {
    const { curso_id } = req.params;
    console.log('Obteniendo detalles de evaluación para el curso:', curso_id);

    try {

        const evaluacionDetalle = await evaluacionService.obtenerEvaluacionDetallePorCurso(curso_id);

        if (!evaluacionDetalle || evaluacionDetalle.length === 0) {
            return res.status(404).json({ message: 'Evaluación no encontrada o sin contenido para este curso' });
        }

        res.status(200).json({
            message: 'Evaluación con preguntas y opciones obtenida exitosamente para el curso',
            data: evaluacionDetalle,
        });
    } catch (error) {
        console.error('Error al obtener la evaluación del curso con sus preguntas y opciones:', error.message);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});


// Ruta para que un usuario responda a una pregunta
router.post('/respuesta-usuario', async (req, res) => {
    const { usuario_id, evaluacion_id, pregunta_id, opcion_seleccionada, respuesta_texto, archivo_url, calificacion } = req.body;
    
    console.log('Datos recibidos para registrar respuesta:', { usuario_id, evaluacion_id, pregunta_id, opcion_seleccionada, respuesta_texto, archivo_url, calificacion });

    if (!usuario_id || !evaluacion_id || !pregunta_id || (opcion_seleccionada === undefined && !respuesta_texto)) {
        return res.status(400).json({ message: 'Faltan campos requeridos' });
    }

    try {
        // Si la respuesta tiene opción seleccionada (respuestas de tipo opción)
        if (opcion_seleccionada !== undefined) {
            // Guardar la respuesta seleccionada
            const nuevaRespuesta = await evaluacionService.crearRespuestaConOpcion({
                usuario_id,
                evaluacion_id,
                pregunta_id,
                opcion_seleccionada,
                calificacion
            });
            console.log('Respuesta con opción seleccionada guardada:', nuevaRespuesta);
            res.status(201).json({ message: 'Respuesta registrada exitosamente', data: nuevaRespuesta });

        } else {
            // Si es una respuesta abierta (texto o archivo)
            const nuevaRespuestaAbierta = await evaluacionService.crearRespuestaAbierta({
                usuario_id,
                evaluacion_id,
                pregunta_id,
                respuesta_texto,
                archivo_url,
                calificacion
            });
            console.log('Respuesta abierta guardada:', nuevaRespuestaAbierta);
            res.status(201).json({ message: 'Respuesta abierta registrada exitosamente', data: nuevaRespuestaAbierta });
        }
    } catch (error) {
        console.error('Error al registrar la respuesta del usuario:', error.message);
        res.status(500).json({ message: 'Error en el servidor', error: error.message });
    }
});


router.get('/verificar-estado/:evaluacion_id', async (req, res) => {
    const { evaluacion_id } = req.params;
    const usuario_id = req.query.usuario_id;

    if (!usuario_id || !evaluacion_id) {
        return res.status(400).json({ 
            message: 'Se requieren el ID del usuario y de la evaluación'
        });
    }

    try {
        const estadoEvaluacion = await evaluacionService.verificarEvaluacionPresentada(
            usuario_id, 
            evaluacion_id
        );
        
        res.status(200).json({
            message: 'Estado de evaluación verificado exitosamente',
            data: {
                evaluacionPresentada: estadoEvaluacion.evaluacionPresentada,
                intentos: estadoEvaluacion.intentos
            }
        });
    } catch (error) {
        console.error('Error al verificar estado de la evaluación:', error);
        res.status(500).json({ 
            message: 'Error al verificar el estado de la evaluación',
            error: error.message 
        });
    }
});



module.exports = router;
