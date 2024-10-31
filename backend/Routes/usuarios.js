const express = require('express'); 
const router = express.Router();
const usuario = require('../Services/usuarios');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const sendResponse = (res, status, message, data = null) => {
    res.status(status).json({ message, data });
};

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
                token: resultado.token,
                nombre: resultado.nombre,
                tipo_usuario_id: resultado.tipo_usuario_id
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

module.exports = router;