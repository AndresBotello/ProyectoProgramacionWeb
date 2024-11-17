const express = require('express'); 
const router = express.Router();
const usuario = require('../Services/usuarios');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sendVerificationEmail = require('../utils/email');
const cloudinary = require('../cloudinaryConfig');
const  multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage });



const sendResponse = (res, status, message, data = null) => {
    res.status(status).json({ message, data });
};


router.put('/perfil/:id', upload.single('imagen'), async (req, res) => {
    try {
        const { id } = req.params;
        console.log('ID recibido:', id);
        const { nombre, correo } = req.body;
        let imagenPerfil = null;

        // Subir la imagen a Cloudinary si se proporciona un archivo
        if (req.file) {
            try {
                const result = await new Promise((resolve, reject) => {
                    cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
                        if (error) {
                            return reject(error);
                        }
                        resolve(result);
                    }).end(req.file.buffer);
                });
                imagenPerfil = result.secure_url;
            } catch (error) {
                console.error('Error al subir la imagen a Cloudinary:', error);
                return res.status(500).json({ message: 'Error al subir la imagen' });
            }
        }

        const usuarioActualizado = { nombre, correo, imagen_perfil: imagenPerfil };

        // Llamar a la función de actualización de perfil
        const resultado = await usuario.actualizarPerfil(id, usuarioActualizado);
        if (resultado.error) {
            return res.status(400).json({ message: resultado.error });
        }

        res.status(200).json({ message: 'Perfil actualizado correctamente', data: resultado.data });
    } catch (error) {
        console.error('Error al actualizar el perfil:', error.message);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});



// Ruta para obtener todos los usuarios
router.get('/todos', async (req, res) => {
    try {
        const resultados = await usuario.Todos();
        if (resultados.error) {
            return sendResponse(res, 403, resultados.error);
        }
        sendResponse(res, 200, 'Usuarios obtenidos exitosamente', resultados);
    } catch (error) {
        console.log('Error mientras se obtenían los usuarios', error.message);
        sendResponse(res, 500, 'Error en el servidor');
    }
});

// Nueva ruta para obtener solo los instructores
router.get('/instructores', async (req, res) => {
    try {
        const resultados = await usuario.obtenerInstructores();
        if (resultados.error) {
            return sendResponse(res, 403, resultados.error);
        }
        sendResponse(res, 200, 'Instructores obtenidos exitosamente', resultados);
    } catch (error) {
        console.error('Error mientras se obtenían los instructores', error.message);
        sendResponse(res, 500, 'Error en el servidor');
    }
});

// Ruta para registrar un nuevo usuario
router.post('/', async (req, res, next) => {
    try {
        const resultado = await usuario.registrarUsuario(req.body);
        if (resultado.message === 'El correo ya está en uso') {
            return res.status(400).json(resultado);
        }
        res.json(resultado);
    } catch (error) {
        console.error('Error durante el registro', error);
        next(error);
    }
});

// Ruta para iniciar sesión
router.post('/login', async function (req, res, next) {
    try {
        const resultado = await usuario.login(req.body);
        if (resultado.token) {
            return res.json({
                id: resultado.id,
                token: resultado.token,
                nombre: resultado.nombre,
                correo: resultado.correo,
                tipo_usuario_id: resultado.tipo_usuario_id,
                imagen_perfil: resultado.imagen_perfil
            });
        } else {
            res.status(401).json({ message: "Usuario o contraseña incorrectos" });
        }
    } catch (error) {
        console.error('Error durante el inicio de sesión', error.message);
        next(error);
    }
});

// Ruta para actualizar un usuario
router.put('/:id', async (req, res) => {
    try {
        const resultado = await usuario.actualizarUsuario(req.params.id, req.body);
        if (resultado.error) {
            return sendResponse(res, 400, resultado.error);
        }
        sendResponse(res, 200, 'Usuario actualizado exitosamente', resultado);
    } catch (error) {
        console.error('Error al actualizar el usuario', error.message);
        sendResponse(res, 500, 'Error en el servidor');
    }
});

// Ruta para eliminar un usuario
router.delete('/:id', async (req, res) => {
    try {
        const resultado = await usuario.eliminarUsuario(req.params.id);
        if (resultado.error) {
            return sendResponse(res, 400, resultado.error);
        }
        sendResponse(res, 200, 'Usuario eliminado exitosamente');
    } catch (error) {
        console.error('Error al eliminar el usuario', error.message);
        sendResponse(res, 500, 'Error en el servidor');
    }
});

//Ruta para verificar gmail
router.post('/verify',  async (req, res) => {
    const  { correo, codigo } = req.body;
    try {
        const user = await usuario.buscarUsuarioPorCorreo(correo);
        if(!user || user.codigo_verificacion  !== codigo) {
            return res.status(400).json({message: 'Código Incorrecto o Usuario no encontrado'});

        }

        await usuario.actualizarVerificado(correo);
        res.json({message: 'Correo verificado con éxito'});
        
    } catch (error) {
        console.error('Error al verificar Usuario: ', error);
        res.status(500).json({message: 'Error en el servidor'});
    }
});



router.post('/password-recovery', async (req, res) => {
    const { correo  } = req.body;
    try {
        const user = await usuario.buscarUsuarioPorCorreo(correo);
        if(!user) {
            return res.status(404).json({message: 'Usuario no encontrado'});
        }

        const codigoRecuperacion = Math.floor(100000  + Math.random() * 900000).toString();
        await  usuario.actualizarCodigoRecuperacion(correo, codigoRecuperacion);
        await sendVerificationEmail(correo,  codigoRecuperacion);
        res.json({message: 'Correo de recuperación enviado, revise su  correo electrónico'});

    } catch (error) {
        console.log('Error al enviar el correo de recuperacion', error);
        res.status(500).json({message: 'Error en el servidor'});
    }

});


router.post('/reset-password', async (req, res) => {
    const { correo, codigo, nuevaContrasena } = req.body;

    if (!nuevaContrasena) {
        return res.status(400).json({ message: 'La nueva contraseña es requerida' });
    }

    try {
        const user = await usuario.buscarUsuarioPorCorreo(correo);
        if (!user || user.codigo_recuperacion !== codigo) {
            return res.status(400).json({ message: 'Código Incorrecto o Usuario no encontrado' });
        }

        const hashpassword = await bcrypt.hash(nuevaContrasena, 10);
        await usuario.cambiarContrasena(correo, hashpassword);
        await usuario.actualizarCodigoRecuperacion(correo, null);
        res.json({ message: 'Contraseña cambiada exitosamente' });

    } catch (error) {
        console.error('Error al cambiar la contraseña', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Ruta para verificar el código de verificación
router.post('/verificar', async (req, res, next) => {
    try {
        const { correo, codigo } = req.body;
        const resultado = await verificarCodigo(correo, codigo);

        if (resultado.error) {
            return res.status(400).json(resultado);
        }
        res.json(resultado);
    } catch (error) {
        console.error('Error durante la verificación', error);
        next(error);
    }
});



router.get('/puntos/:instructor_id', async (req, res) => {
    const { instructor_id } = req.params;

    if (!instructor_id) {
        return sendResponse(res, 400, 'El ID del instructor es obligatorio.');
    }

    try {
        const resultados = await usuario.obtenerPuntosPorInstructor(instructor_id);

        if (resultados.error) {
            return sendResponse(res, 404, resultados.error);
        }

        
        return sendResponse(res, 200, 'Puntos obtenidos correctamente.', resultados);
    } catch (error) {
        console.error('Error al procesar la solicitud:', error.message);
        return sendResponse(res, 500, 'Ocurrió un error interno al obtener los puntos.');
    }
});




module.exports = router;
