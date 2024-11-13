const express = require('express');
const router = express.Router();
const cursoService = require('../Services/Cursos');
const cloudinary = require('../cloudinaryConfig');
const multer = require('multer');

const storage = multer.memoryStorage(); 
const upload = multer({ storage });



// Función de ayuda para enviar la respuesta
const sendResponse = (res, status, message, data = null) => {
    res.status(status).json({ message, data });
};

router.get('/todos', async (req, res) => {
    const { categoria, nivel } = req.query; 
  
    try {
      const resultados = await cursoService.obtenerTodosLosCursos(categoria, nivel);
      if (resultados.error) {
        return res.status(403).json({ message: resultados.error });
      }
      res.status(200).json({ message: 'Cursos obtenidos exitosamente', data: resultados });
    } catch (error) {
      console.error('Error mientras se obtenían los cursos', error.message);
      res.status(500).json({ message: 'Error en el servidor' });
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


router.post('/lecciones', upload.fields([{ name: 'imagen', maxCount: 1 }, { name: 'video', maxCount: 1 }]), async (req, res) => {
    try {
        const { titulo, contenido, curso_id, orden } = req.body;

        if (!titulo || !contenido || !curso_id || !orden) {
            return res.status(400).json({ message: 'Faltan campos requeridos (titulo, contenido, curso_id, orden)' });
        }

        let imagenUrl = null;
        let videoUrl = null;

        if (req.files && req.files['imagen']) {
            try {
                const result = await new Promise((resolve, reject) => {
                    cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
                        if (error) {
                            return reject(error);
                        }
                        resolve(result);
                    }).end(req.files['imagen'][0].buffer);
                });
                imagenUrl = result.secure_url;
                console.log('resultados,', result);
            } catch (error) {
                console.error('Error al subir la imagen a Cloudinary:', error);
                return res.status(500).json({ message: 'Error al subir la imagen' });
            }
        }

        if (req.files && req.files['video']) {
            try {
                const result = await new Promise((resolve, reject) => {
                    cloudinary.uploader.upload_stream({ resource_type: 'video' }, (error, result) => {
                        if (error) {
                            return reject(error);
                        }
                        resolve(result);
                    }).end(req.files['video'][0].buffer);
                });
                
                videoUrl = result.secure_url;
                console.log('resultados,', result);
            } catch (error) {
                console.error('Error al subir el video a Cloudinary:', error);
                return res.status(500).json({ message: 'Error al subir el video' });
            }
        }

        // Log para verificar los datos
        console.log("Datos para guardar en la lección:", {
            titulo,
            contenido,
            curso_id,
            orden,
            imagen_url: imagenUrl,
            video_url: videoUrl
        });

        // Guardar la lección en la base de datos
        const nuevaLeccion = await cursoService.crearLeccion({
            titulo,
            contenido,
            curso_id,
            orden,
            imagen_url: imagenUrl,
            video_url: videoUrl,
        });

        res.status(201).json({ message: 'Lección creada exitosamente', data: nuevaLeccion });
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


// Ruta para inscribir a un usuario en un curso
router.post('/inscripciones', async (req, res) => {
    try {
        const { usuario_id, curso_id } = req.body;

        if (!usuario_id || !curso_id) {
            return sendResponse(res, 400, 'Faltan parámetros');
        }

        const resultado = await cursoService.inscribirEstudiante(usuario_id, curso_id);

        if (resultado.error) {
            return sendResponse(res, 400, resultado.error);
        }

        sendResponse(res, 200, resultado.message);
    } catch (error) {
        console.error('Error al inscribir al usuario:', error.message);
        sendResponse(res, 500, 'Error en el servidor');
    }
});



router.get('/filtrado', async (req, res) => {
    try {
        const { categoria, nivel } = req.query; 

        if (!categoria || !nivel) {
            return res.status(400).json({ message: 'Se requiere categoría y nivel para filtrar los cursos' });
        }

        const cursos = await cursoService.obtenerCursosFiltrados(categoria, nivel); // Verifica que la función esté bien
        if (!cursos || cursos.length === 0) {
            return res.status(404).json({ message: 'No se encontró el curso' });
        }

        res.status(200).json({ message: 'Curso obtenido exitosamente', data: cursos });
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor' });
    }
});




module.exports = router;
