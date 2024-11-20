const db = require('./db');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');
const fs = require('fs').promises;

const Certificar = {
    // Generate database record for certificate
    async generarRegistroCertificado(usuarioId, cursoId, nombre) {
        const connection = await db.pool.getConnection();
        try {
            await connection.beginTransaction();

            // Check if certificate already exists
            const certificadoExistente = await connection.query(
                'SELECT * FROM certificados WHERE usuario_id = ? AND curso_id = ?',
                [usuarioId, cursoId]
            );

            if (certificadoExistente[0].length > 0) {
                return { error: 'El certificado ya existe para este curso' };
            }

            // Generate unique URL for certificate
            const certificadoUrl = `certificate_${usuarioId}_${cursoId}_${Date.now()}.png`;

            // Insert certificate record
            const result = await connection.query(
                'INSERT INTO certificados (usuario_id, curso_id, nombre, certificado_url) VALUES (?, ?, ?, ?)',
                [usuarioId, cursoId, nombre, certificadoUrl]
            );
        
            await connection.commit();
            return {
                success: true,
                certificadoId: result[0].insertId,
                certificadoUrl
            };
        } catch (error) {
            await connection.rollback();
            console.error('Error al generar certificado:', error);
            throw error;
        } finally {
            connection.release();
        }
    },

    // Generate physical certificate file
    async generarArchivoCertificado(userData) {
        // Validate input data
        if (!userData || !userData.studentId || !userData.studentName || !userData.courseName) {
            throw new Error('Datos de usuario incompletos');
        }

        try {
            // Ensure certificates directory exists
            await fs.mkdir(path.join(__dirname, '../public/certificates'), { recursive: true });

            // Create canvas with certificate dimensions
            const canvas = createCanvas(1920, 1080);
            const ctx = canvas.getContext('2d');

            // Set background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Add decorative border
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 20;
            ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

            // Add inner border
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 2;
            ctx.strokeRect(60, 60, canvas.width - 120, canvas.height - 120);

            // Configure text styling
            ctx.textAlign = 'center';
            ctx.fillStyle = '#1e293b';

            // Add certificate header
            ctx.font = 'bold 80px Arial';
            ctx.fillText('Certificado de Finalización', canvas.width / 2, 200);

            // Add decorative line
            ctx.beginPath();
            ctx.moveTo(canvas.width / 2 - 200, 250);
            ctx.lineTo(canvas.width / 2 + 200, 250);
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Add presentation text
            ctx.font = '40px Arial';
            ctx.fillText('Se certifica que', canvas.width / 2, 350);

            // Add student name
            ctx.font = 'bold 60px Arial';
            ctx.fillText(userData.studentName, canvas.width / 2, 450);

            // Add completion text
            ctx.font = '40px Arial';
            ctx.fillText('ha completado satisfactoriamente el curso', canvas.width / 2, 550);

            // Add course name
            ctx.font = 'bold 50px Arial';
            ctx.fillText(userData.courseName, canvas.width / 2, 650);

            // Add completion date
            const completionDate = new Date().toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            ctx.font = '35px Arial';
            ctx.fillText(`Completado el ${completionDate}`, canvas.width / 2, 750);

            // Add signature lines
            const signatureY = 900;
            const signatureWidth = 250;
            
            // Left signature
            ctx.beginPath();
            ctx.moveTo(canvas.width / 4 - signatureWidth/2, signatureY);
            ctx.lineTo(canvas.width / 4 + signatureWidth/2, signatureY);
            ctx.stroke();
            ctx.font = '30px Arial';
            ctx.fillText('Instructor', canvas.width / 4, signatureY + 50);

            // Right signature
            ctx.beginPath();
            ctx.moveTo(3 * canvas.width / 4 - signatureWidth/2, signatureY);
            ctx.lineTo(3 * canvas.width / 4 + signatureWidth/2, signatureY);
            ctx.stroke();
            ctx.fillText('Administrador', 3 * canvas.width / 4, signatureY + 50);

            // Generate unique filename
            const filename = `certificate_${userData.studentId}_${userData.cursoId || Date.now()}.png`;
            const certificatePath = path.join('certificates', filename);

            // Save the certificate
            const buffer = canvas.toBuffer('image/png');
            await fs.writeFile(path.join(__dirname, '../public', certificatePath), buffer);

            return {
                success: true,
                certificatePath: `/${certificatePath}`,
                message: 'Certificado generado exitosamente'
            };
        } catch (error) {
            // Enhanced error logging
            console.error('Error generando certificado:', {
                message: error.message,
                stack: error.stack,
                userData
            });
            
            return {
                success: false,
                message: 'Error al generar el certificado',
                details: error.message
            };
        }
    }
};

module.exports = Certificar;