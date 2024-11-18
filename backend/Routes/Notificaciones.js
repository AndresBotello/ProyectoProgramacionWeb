const express = require('express');
const router = express.Router();
const NotificacionService = require('../Services/Notificacion');


router.get('/mis-notificaciones/:usuarioId', async (req, res) => {
    try {
        const usuarioId = req.params.usuarioId; // Obtener el ID del usuario de los parámetros de la URL
        const notificaciones = await NotificacionService.obtenerNotificacionesUsuario(usuarioId);
        res.json({ success: true, data: notificaciones });
    } catch (error) {
        console.error('Error al obtener notificaciones:', error);
        res.status(500).json({ success: false, message: 'Error al obtener notificaciones' });
    }
});

// Ruta para marcar una notificación como leída
router.put('/:notificacionId/marcar-leida', async (req, res) => {
    try {
        const notificacionId = req.params.notificacionId;
        const resultado = await NotificacionService.marcarNotificacionComoLeida(notificacionId);
        if (resultado.success) {
            res.json({ success: true, message: 'Notificación marcada como leída' });
        } else {
            res.status(400).json({ success: false, message: resultado.message });
        }
    } catch (error) {
        console.error('Error al marcar notificación como leída:', error);
        res.status(500).json({ success: false, message: 'Error al marcar notificación como leída' });
    }
});

module.exports = router;

