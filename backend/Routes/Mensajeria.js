const express = require('express');
const router = express.Router();
const mensajeria = require('../Services/Mensajeria');

const sendResponse = (res, status, message, data = null) => {
    res.status(status).json({ message, data });
};

// Obtener todos los mensajes de un usuario con paginación
router.get('/usuario/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        const resultado = await mensajeria.obtenerMensajesUsuario(userId, page, limit);
        if (resultado.error) {
            return sendResponse(res, 400, resultado.error);
        }
        sendResponse(res, 200, 'Mensajes obtenidos exitosamente', resultado);
    } catch (error) {
        console.error('Error al obtener los mensajes del usuario:', error.message);
        sendResponse(res, 500, 'Error en el servidor');
    }
});

// Obtener conversación entre dos usuarios
router.get('/conversacion/:remitenteId/:destinatarioId', async (req, res) => {
    try {
        const { remitenteId, destinatarioId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        // Obtener solo los mensajes enviados por el remitente
        const resultado = await mensajeria.obtenerConversacion(remitenteId, destinatarioId, page, limit);
        if (resultado.error) {
            return sendResponse(res, 400, resultado.error);
        }
        sendResponse(res, 200, 'Conversación obtenida exitosamente', resultado);
    } catch (error) {
        console.error('Error al obtener la conversación:', error.message);
        sendResponse(res, 500, 'Error en el servidor');
    }
});



// Enviar un mensaje
router.post('/enviar', async (req, res) => {
    try {
        const resultado = await mensajeria.enviarMensaje(req.body);
        if (resultado.error) {
            return sendResponse(res, 400, resultado.error);
        }
        sendResponse(res, 201, 'Mensaje enviado exitosamente', resultado);
    } catch (error) {
        console.error('Error al enviar el mensaje:', error.message);
        sendResponse(res, 500, 'Error en el servidor');
    }
});

// Eliminar un mensaje
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.body.usuarioId; // Asegúrate de enviar el usuarioId en el body

        const resultado = await mensajeria.eliminarMensaje(id, usuarioId);
        if (resultado.error) {
            return sendResponse(res, 400, resultado.error);
        }
        sendResponse(res, 200, 'Mensaje eliminado exitosamente');
    } catch (error) {
        console.error('Error al eliminar el mensaje:', error.message);
        sendResponse(res, 500, 'Error en el servidor');
    }
});

// Obtener cantidad de mensajes no leídos
router.get('/no-leidos/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const resultado = await mensajeria.obtenerMensajesNoLeidos(userId);
        if (resultado.error) {
            return sendResponse(res, 400, resultado.error);
        }
        sendResponse(res, 200, 'Cantidad de mensajes no leídos obtenida exitosamente', resultado);
    } catch (error) {
        console.error('Error al obtener mensajes no leídos:', error.message);
        sendResponse(res, 500, 'Error en el servidor');
    }
});


// Responder a un mensaje
router.post('/responder', async (req, res) => {
    try {
        const { mensajeId, contenido, remitenteId } = req.body;
        const resultado = await mensajeria.responderMensaje(mensajeId, contenido, remitenteId);
        if (resultado.error) {
            return sendResponse(res, 400, resultado.error);
        }
        sendResponse(res, 201, 'Respuesta enviada exitosamente', resultado);
    } catch (error) {
        console.error('Error al responder el mensaje:', error.message);
        sendResponse(res, 500, 'Error en el servidor');
    }
});


// Obtener mensajes recibidos y marcarlos como leídos
router.get('/mensajeria-recibidos/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const marcarLeido = req.query.marcarLeido === 'true'; // Parámetro opcional para marcar como leído

        // Primero obtenemos los mensajes
        const mensajes = await mensajeria.obtenerMensajesRecibidos(userId, page, limit);
        
        if (mensajes.error) {
            return sendResponse(res, 400, mensajes.error);
        }

        // Si se solicita marcar como leídos y hay mensajes
        if (marcarLeido && mensajes.data && mensajes.data.length > 0) {
            const mensajesIds = mensajes.data
                .filter(msg => !msg.leido)
                .map(msg => msg.id);

            if (mensajesIds.length > 0) {
                await mensajeria.marcarMensajesComoLeidos(mensajesIds, userId);
            }
        }

        // Estructura de respuesta mejorada
        const respuesta = {
            mensajes: mensajes.data,
            paginacion: {
                pagina_actual: page,
                items_por_pagina: limit,
                total_items: mensajes.total,
                total_paginas: Math.ceil(mensajes.total / limit)
            },
            mensajes_no_leidos: mensajes.data.filter(msg => !msg.leido).length
        };

        sendResponse(res, 200, 'Mensajes recibidos obtenidos exitosamente', respuesta);

    } catch (error) {
        console.error('Error al obtener los mensajes recibidos:', error.message);
        sendResponse(res, 500, 'Error en el servidor');
    }
});

// Marcar mensaje específico como leído
router.put('/marcar-leido/:mensajeriaId', async (req, res) => {
    try {
        const { mensajeId } = req.params;
        const { userId } = req.body;

        const resultado = await mensajeria.marcarMensajeComoLeido(mensajeId, userId);
        
        if (resultado.error) {
            return sendResponse(res, 400, resultado.error);
        }

        sendResponse(res, 200, 'Mensaje marcado como leído exitosamente');

    } catch (error) {
        console.error('Error al marcar mensaje como leído:', error.message);
        sendResponse(res, 500, 'Error en el servidor');
    }
});

// Responder a un mensaje y marcarlo como leído
router.post('/responder-mensajeria/:mensajeriaId', async (req, res) => {
    try {
        const { mensajeId } = req.params;
        const { contenido, remitenteId } = req.body;

        // Primero marcamos el mensaje original como leído
        await mensajeria.marcarMensajeComoLeido(mensajeId, remitenteId);

        // Luego enviamos la respuesta
        const resultado = await mensajeria.responderMensaje(mensajeId, contenido, remitenteId);
        
        if (resultado.error) {
            return sendResponse(res, 400, resultado.error);
        }

        sendResponse(res, 201, 'Respuesta enviada y mensaje marcado como leído', resultado);

    } catch (error) {
        console.error('Error al responder y marcar mensaje:', error.message);
        sendResponse(res, 500, 'Error en el servidor');
    }
});


// Ruta para obtener mensajes de un instructor y responder
router.get('/instructor-mensajeria/:instructorId', async (req, res) => {
    try {
        const { instructorId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        // Obtener mensajes recibidos por el instructor
        const resultado = await mensajeria.obtenerMensajesInstructor(instructorId, page, limit);
        
        if (resultado.error) {
            return sendResponse(res, 400, resultado.error);
        }
        
        sendResponse(res, 200, 'Mensajes del instructor obtenidos exitosamente', resultado);
    } catch (error) {
        console.error('Error al obtener mensajes del instructor:', error.message);
        sendResponse(res, 500, 'Error en el servidor');
    }
});

// Ruta para que un instructor responda a un mensaje específico
router.post('/instructor-responder', async (req, res) => {
    try {
        const { 
            mensaje_id,  // ID del mensaje original
            contenido,   // Contenido de la respuesta
            instructor_id // ID del instructor que responde
        } = req.body;

        const resultado = await mensajeria.responderComoInstructor(mensaje_id, contenido, instructor_id);
        
        if (resultado.error) {
            return sendResponse(res, 400, resultado.error);
        }
        
        sendResponse(res, 201, 'Respuesta del instructor enviada exitosamente', resultado);
    } catch (error) {
        console.error('Error al responder como instructor:', error.message);
        sendResponse(res, 500, 'Error en el servidor');
    }
});

module.exports = router;


