const db = require('./db');
const { emptyOrRows } = require('../helper');

class MensajeriaService {
    async validarUsuarios(usuarioIds) {
        try {
            console.log('Validando usuarios con IDs:', usuarioIds);
            
            // Verificar que usuarioIds no esté vacío
            if (!usuarioIds || usuarioIds.length === 0) {
                return false;
            }

            const query = 'SELECT COUNT(*) as count FROM usuarios WHERE id IN (?)';
            console.log('Query de validación:', query);

            // Asegurarnos de que estamos usando el pool de conexiones correctamente
            const [rows] = await db.pool.query(query, [usuarioIds]);
            console.log('Resultado de la validación:', rows);

            // Verificar que rows tiene datos y acceder al primer elemento
            if (!rows || rows.length === 0) {
                return false;
            }

            return rows[0].count === usuarioIds.length;
        } catch (error) {
            console.error('Error en validarUsuarios:', error);
            throw error;
        }
    }

    async obtenerMensajesUsuario(userId, page = 1, limit = 20) {
        const connection = await db.pool.getConnection();
        try {
            const userExists = await this.validarUsuarios([userId]);
            if (!userExists) {
                throw new Error('Usuario no encontrado');
            }

            const offset = (page - 1) * limit;
            const query = `
                SELECT 
                    m.id,
                    m.contenido,
                    m.fecha_envio,
                    u1.id as remitente_id,
                    u1.nombre as remitente_nombre,
                    u2.id as destinatario_id,
                    u2.nombre as destinatario_nombre
                FROM mensajes m
                JOIN usuarios u1 ON m.remitente_id = u1.id
                JOIN usuarios u2 ON m.destinatario_id = u2.id
                WHERE m.remitente_id = ? OR m.destinatario_id = ?
                ORDER BY m.fecha_envio DESC
                LIMIT ? OFFSET ?
            `;

            const countQuery = `
                SELECT COUNT(*) as total
                FROM mensajes
                WHERE remitente_id = ? OR destinatario_id = ?
            `;

            const [mensajes] = await connection.query(query, [userId, userId, limit, offset]);
            const [totalCount] = await connection.query(countQuery, [userId, userId]);

            const data = emptyOrRows(mensajes);
            return {
                data,
                pagination: {
                    page,
                    limit,
                    total: totalCount[0].total,
                    totalPages: Math.ceil(totalCount[0].total / limit)
                }
            };
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }
    }

    async obtenerConversacion(remitenteId, destinatarioId, page = 1, limit = 20) {
        const connection = await db.pool.getConnection();
        try {
            const usersExist = await this.validarUsuarios([remitenteId, destinatarioId]);
            if (!usersExist) {
                throw new Error('Uno o ambos usuarios no existen');
            }
    
            const offset = (page - 1) * limit;
            const query = `
                SELECT 
                    m.id,
                    m.contenido,
                    m.fecha_envio,
                    u1.id as remitente_id,
                    u1.nombre as remitente_nombre,
                    u2.id as destinatario_id,
                    u2.nombre as destinatario_nombre
                FROM mensajes m
                JOIN usuarios u1 ON m.remitente_id = u1.id
                JOIN usuarios u2 ON m.destinatario_id = u2.id
                WHERE 
                    (m.remitente_id = ? AND m.destinatario_id = ?)
                    OR 
                    (m.remitente_id = ? AND m.destinatario_id = ?)
                ORDER BY m.fecha_envio DESC
                LIMIT ? OFFSET ?
            `;
    
            const [mensajes] = await connection.query(query, [
                remitenteId, destinatarioId,
                destinatarioId, remitenteId,
                limit, offset
            ]);
    
            await connection.commit();
            return { data: emptyOrRows(mensajes) };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
    

    async enviarMensaje(mensaje) {
        const connection = await db.pool.getConnection();
        try {
            const { remitente_id, destinatario_id, contenido } = mensaje;

            // Convertimos los IDs a números para asegurar el tipo correcto
            const remitenteIdNum = Number(remitente_id);
            const destinatarioIdNum = Number(destinatario_id);

            console.log('Intentando enviar mensaje:', {
                remitente_id: remitenteIdNum,
                destinatario_id: destinatarioIdNum,
                contenido: contenido
            });

            const usuariosExisten = await this.validarUsuarios([remitenteIdNum, destinatarioIdNum]);
            console.log('¿Usuarios existen?', usuariosExisten);

            if (!usuariosExisten) {
                throw new Error('Uno o ambos usuarios no existen');
            }

            if (!contenido?.trim()) {
                throw new Error('El contenido del mensaje no puede estar vacío');
            }

            await connection.beginTransaction();

            const [result] = await connection.query(
                `INSERT INTO mensajes (
                    remitente_id, 
                    destinatario_id, 
                    contenido, 
                    fecha_envio
                ) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
                [remitenteIdNum, destinatarioIdNum, contenido.trim()]
            );

            const [mensajeInsertado] = await connection.query(
                `SELECT 
                    m.id, 
                    m.contenido, 
                    m.fecha_envio,
                    u1.id as remitente_id, 
                    u1.nombre as remitente_nombre,
                    u2.id as destinatario_id, 
                    u2.nombre as destinatario_nombre
                FROM mensajes m
                JOIN usuarios u1 ON m.remitente_id = u1.id
                JOIN usuarios u2 ON m.destinatario_id = u2.id
                WHERE m.id = ?`,
                [result.insertId]
            );

            await connection.commit();
            return { data: mensajeInsertado[0] };
        } catch (error) {
            await connection.rollback();
            console.error('Error completo al enviar mensaje:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    async eliminarMensaje(id, usuarioId) {
        const connection = await db.pool.getConnection();
        try {
            await connection.beginTransaction();

            const [mensaje] = await connection.query(
                'SELECT remitente_id, destinatario_id FROM mensajes WHERE id = ?',
                [id]
            );

            if (!mensaje.length) {
                throw new Error('Mensaje no encontrado');
            }

            if (mensaje[0].remitente_id !== usuarioId && mensaje[0].destinatario_id !== usuarioId) {
                throw new Error('No tienes permiso para eliminar este mensaje');
            }

            await connection.query('DELETE FROM mensajes WHERE id = ?', [id]);

            await connection.commit();
            return { message: 'Mensaje eliminado exitosamente' };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async responderMensaje(mensajeId, contenido, remitenteId) {
        const connection = await db.pool.getConnection();
        try {
            await connection.beginTransaction();

            // Obtener el mensaje original
            const [mensajeOriginal] = await connection.query(
                'SELECT remitente_id, destinatario_id FROM mensajes WHERE id = ?',
                [mensajeId]
            );

            if (!mensajeOriginal.length) {
                throw new Error('Mensaje original no encontrado');
            }

            const { remitente_id, destinatario_id } = mensajeOriginal[0];

            // Crear una nueva entrada en la base de datos con el contenido de la respuesta
            const [result] = await connection.query(
                `INSERT INTO mensajes (
                    remitente_id, 
                    destinatario_id, 
                    contenido, 
                    fecha_envio
                ) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
                [remitenteId, destinatario_id, contenido.trim()]
            );

            const [mensajeInsertado] = await connection.query(
                `SELECT 
                    m.id, 
                    m.contenido, 
                    m.fecha_envio,
                    u1.id as remitente_id, 
                    u1.nombre as remitente_nombre,
                    u2.id as destinatario_id, 
                    u2.nombre as destinatario_nombre
                FROM mensajes m
                JOIN usuarios u1 ON m.remitente_id = u1.id
                JOIN usuarios u2 ON m.destinatario_id = u2.id
                WHERE m.id = ?`,
                [result.insertId]
            );

            await connection.commit();
            return { data: mensajeInsertado[0] };
        } catch (error) {
            await connection.rollback();
            console.error('Error al responder mensaje:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    
    // Método para obtener mensajes de un instructor
async obtenerMensajesInstructor(instructorId, page = 1, limit = 20) {
    const connection = await db.pool.getConnection();
    try {
        // Validar que el instructor existe
        const userExists = await this.validarUsuarios([instructorId]);
        if (!userExists) {
            throw new Error('Instructor no encontrado');
        }

        const offset = (page - 1) * limit;
        const query = `
            SELECT 
                m.id,
                m.contenido,
                m.fecha_envio,
                u1.id as remitente_id,
                u1.nombre as remitente_nombre,
                u2.id as destinatario_id,
                u2.nombre as destinatario_nombre,
                m.leido
            FROM mensajes m
            JOIN usuarios u1 ON m.remitente_id = u1.id
            JOIN usuarios u2 ON m.destinatario_id = u2.id
            WHERE m.destinatario_id = ?
            ORDER BY m.fecha_envio DESC
            LIMIT ? OFFSET ?
        `;

        const countQuery = `
            SELECT COUNT(*) as total
            FROM mensajes
            WHERE destinatario_id = ?
        `;

        const [mensajes] = await connection.query(query, [instructorId, limit, offset]);
        const [totalCount] = await connection.query(countQuery, [instructorId]);

        const data = emptyOrRows(mensajes);
        return {
            data,
            pagination: {
                page,
                limit,
                total: totalCount[0].total,
                totalPages: Math.ceil(totalCount[0].total / limit)
            }
        };
    } catch (error) {
        throw error;
    } finally {
        connection.release();
    }
}

// Método para que un instructor responda a un mensaje
async responderComoInstructor(mensajeId, contenido, instructorId) {
    const connection = await db.pool.getConnection();
    try {
        await connection.beginTransaction();

        // Obtener el mensaje original
        const [mensajeOriginal] = await connection.query(
            'SELECT remitente_id, destinatario_id FROM mensajes WHERE id = ?',
            [mensajeId]
        );

        if (!mensajeOriginal.length) {
            throw new Error('Mensaje original no encontrado');
        }

        // Verificar que el instructor es el destinatario del mensaje original
        if (mensajeOriginal[0].destinatario_id !== instructorId) {
            throw new Error('No tienes permiso para responder a este mensaje');
        }

        // Obtener el ID del remitente original (estudiante)
        const { remitente_id: estudianteId } = mensajeOriginal[0];

        // Crear una nueva entrada en la base de datos con el contenido de la respuesta
        const [result] = await connection.query(
            `INSERT INTO mensajes (
                remitente_id, 
                destinatario_id, 
                contenido, 
                fecha_envio
            ) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
            [instructorId, estudianteId, contenido.trim()]
        );

        // Obtener los detalles del mensaje insertado
        const [mensajeInsertado] = await connection.query(
            `SELECT 
                m.id, 
                m.contenido, 
                m.fecha_envio,
                u1.id as remitente_id, 
                u1.nombre as remitente_nombre,
                u2.id as destinatario_id, 
                u2.nombre as destinatario_nombre
            FROM mensajes m
            JOIN usuarios u1 ON m.remitente_id = u1.id
            JOIN usuarios u2 ON m.destinatario_id = u2.id
            WHERE m.id = ?`,
            [result.insertId]
        );

        await connection.commit();
        return { data: mensajeInsertado[0] };
    } catch (error) {
        await connection.rollback();
        console.error('Error al responder como instructor:', error);
        throw error;
    } finally {
        connection.release();
    }
}
    
}

module.exports = new MensajeriaService();


