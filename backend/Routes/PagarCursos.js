const express = require('express');
const router = express.Router();
const PagoService = require('../Services/PagarCursos');

router.post('/crear', async (req, res) => {
    try {
        console.log('Received payment creation request:', req.body); // Add logging
        const { usuario_id, curso_id, correo } = req.body;

        if (!usuario_id || !curso_id || !correo) {
            return res.status(400).json({ 
                message: 'Faltan datos requeridos' 
            });
        }

        const resultado = await PagoService.crearPago(usuario_id, curso_id, correo);
        console.log('Payment creation result:', resultado); // Add logging
        res.json(resultado);
    } catch (error) {
        console.error('Full error details:', error); // Detailed error logging
        res.status(500).json({ 
            message: 'Error al procesar el pago',
            errorDetails: error.message || error.toString() // Use message or .toString() to get the actual error
        });
    }
});


// Webhook para recibir notificaciones de Mercado Pago
router.post('/webhook', async (req, res) => {
    try {
        await PagoService.procesarWebhook(req.body);
        res.status(200).send();
    } catch (error) {
        console.error('Error en webhook:', error);
        res.status(500).send();
    }
});


router.get('/verificar', async (req, res) => {
    try {
        const { payment_id, external_reference, collection_status } = req.query;

        console.log('Parámetros de verificación:', { 
            payment_id, 
            external_reference, 
            collection_status 
        });

        // Validaciones iniciales
        if (!payment_id || !external_reference) {
            return res.status(400).json({
                success: false,
                message: 'Faltan parámetros de pago'
            });
        }

        // Verificar pago
        const result = await PagoService.verificarPago(payment_id, external_reference);
        
        // Manejar diferentes escenarios de resultado
        if (result.success) {
            return res.status(200).json(result);
        } else {
            // Usar un código de estado apropiado
            return res.status(400).json(result);
        }

    } catch (error) {
        // Este bloque catch ahora es menos probable que se ejecute
        console.error('Error en ruta de verificación:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            errorDetails: error.message
        });
    }
});



module.exports = router;