const express = require('express');
const router = express.Router();
const certificarService = require('../Services/Certificar');

router.post('/generar', async (req, res) => {
    try {
        const { usuario_id, curso_id, nombre, nombre_curso } = req.body;

        if (!usuario_id || !curso_id || !nombre) {
            return res.status(400).json({
                success: false,
                message: 'Faltan datos requeridos (usuario_id, curso_id, nombre)'
            });
        }

        // Primero generar el registro en la base de datos
        const dbResult = await certificarService.generarRegistroCertificado(usuario_id, curso_id, nombre);

        if (dbResult.error) {
            return res.status(400).json({
                success: false,
                message: dbResult.error
            });
        }

        // Luego generar el archivo físico del certificado
        const certificateResult = await certificarService.generarArchivoCertificado({
            studentId: usuario_id,
            studentName: nombre,
            courseName: nombre_curso
        });

        if (certificateResult.success) {
            return res.status(201).json({
                success: true,
                message: 'Certificado generado exitosamente',
                data: {
                    certificadoId: dbResult.certificadoId,
                    certificadoUrl: certificateResult.certificatePath
                }
            });
        } else {
            return res.status(500).json({
                success: false,
                message: certificateResult.message
            });
        }
    } catch (error) {
        console.error('Error al generar certificado:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor',
            error: error.message
        });
    }
});

module.exports = router;
