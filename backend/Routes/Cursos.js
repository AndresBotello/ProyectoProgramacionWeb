const express = require('express');
const router = express.Router();
const cursoService = require('../Services/Cursos');

// Función de ayuda para enviar la respuesta
const sendResponse = (res, status, message, data = null) => {
    res.status(status).json({ message, data });
};

// Ruta para obtener todos los cursos
router.get('/todos', async (req, res) => {
    try {
        const resultados = await cursoService.obtenerTodosLosCursos();
        if (resultados.error) {
            return sendResponse(res, 403, resultados.error);
        }
        sendResponse(res, 200, 'Cursos obtenidos exitosamente', resultados);
    } catch (error) {
        console.error('Error mientras se obtenían los cursos', error.message);
        sendResponse(res, 500, 'Error en el servidor');
    }
});

// Ruta para crear un nuevo curso
router.post('/', async (req, res, next) => {
    try {
        const resultado = await cursoService.crearCurso(req.body);
        if (resultado.error) {
            return res.status(400).json(resultado);
        }
        res.json({ message: 'Curso creado exitosamente', data: resultado });
    } catch (error) {
        console.error('Error al crear el curso', error);
        next(error);
    }
});

// Ruta para obtener un curso por su ID
router.get('/:id', async (req, res) => {
    try {
        const curso = await cursoService.obtenerCursoPorId(req.params.id);
        if (!curso) {
            return sendResponse(res, 404, 'Curso no encontrado');
        }
        sendResponse(res, 200, 'Curso obtenido exitosamente', curso);
    } catch (error) {
        console.error('Error al obtener el curso', error.message);
        sendResponse(res, 500, 'Error en el servidor');
    }
});

// Ruta para eliminar un curso
router.delete('/:id', async (req, res) => {
    try {
        const resultado = await cursoService.eliminarCurso(req.params.id);
        if (resultado.error) {
            return res.status(400).json(resultado.error);
        }
        res.json({ message: 'Curso eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar el curso:', error.message);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Ruta para editar/actualizar un curso
router.put('/:id', async (req, res) => {
    try {
        const resultado = await cursoService.actualizarCurso(req.params.id, req.body);
        if (resultado.error) {
            return res.status(400).json(resultado.error);
        }
        res.json({ message: 'Curso actualizado correctamente', data: resultado });
    } catch (error) {
        console.error('Error al actualizar el curso:', error.message);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});


// Ruta para crear una nueva lección
router.post('/lecciones', async (req, res) => {
    try {
        const { titulo, contenido, video_url, curso_id, orden } = req.body;

        const resultado = await cursoService.crearLeccion({ titulo, contenido, video_url, curso_id, orden });
        if (resultado.error) {
            return res.status(400).json(resultado);
        }
        res.json({ message: 'Lección creada exitosamente', data: resultado });
    } catch (error) {
        console.error('Error al crear la lección:', error.message);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});


router.get('/instructores', async (req, res) => {
    try {
        const instructores = await cursoService.obtenerInstructores();
        sendResponse(res, 200, 'Instructores obtenidos exitosamente', instructores);
    } catch (error) {
        console.error('Error al obtener instructores:', error.message);
        sendResponse(res, 500, 'Error en el servidor');
    }
});



module.exports = router;
