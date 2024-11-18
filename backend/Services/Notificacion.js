const db = require('./db');
const { emptyOrRows } = require('../helper');

class NotificacionService {
    async crearNotificacion(connection, usuarioId, contenido, tipoNotificacionId) {
        const query = `
            INSERT INTO notificaciones (usuario_id, contenido, tipo_notificacion_id, leida)
            VALUES (?, ?, ?, FALSE)
        `;
        try {
            const result = await connection.query(query, [usuarioId, contenido, tipoNotificacionId]);
            return { success: true, notificacionId: result[0].insertId };
        } catch (error) {
            console.error('Error al crear notificación:', error);
            throw error;
        }
    }

    async notificarNuevoCurso(cursoId, instructorId, connection) {
        let conn;
        try {
            // Usar la conexión proporcionada o crear una nueva si no se proporciona
            const shouldReleaseConnection = !connection;
            conn = connection || await db.pool.getConnection();

            // Obtener detalles del curso
            const [rows] = await conn.query('SELECT titulo FROM cursos WHERE id = ?', [cursoId]);
            const curso = rows[0];

            // Verificar si se encontró el curso
            if (!curso) {
                throw new Error(`No se encontró el curso con ID: ${cursoId}`);
            }

            // Obtener todos los usuarios (estudiantes)
            const [usuarios] = await conn.query('SELECT id FROM usuarios WHERE tipo_usuario_id = 1');
            if (!usuarios || usuarios.length === 0) {
                console.log('No se encontraron estudiantes para notificar');
                return { success: true, message: 'No hay estudiantes para notificar' };
            }

            // Crear notificación para cada usuario
            const contenido = `Nuevo curso disponible: ${curso.titulo}`;
            const TIPO_NOTIFICACION_NUEVO_CURSO = 1;

            // Crear las notificaciones usando la misma conexión
            const notificacionesPromises = usuarios.map(usuario => 
                this.crearNotificacion(conn, usuario.id, contenido, TIPO_NOTIFICACION_NUEVO_CURSO)
            );

            await Promise.all(notificacionesPromises);

            return { 
                success: true, 
                message: 'Notificaciones enviadas exitosamente',
                notificacionesEnviadas: usuarios.length
            };
        } catch (error) {
            console.error('Error al enviar notificaciones de nuevo curso:', error);
            throw error;
        } finally {
            // Solo liberamos la conexión si la creamos aquí
            if (conn && !connection) {
                conn.release();
            }
        }
    }

    async obtenerNotificacionesUsuario(usuarioId, pagina = 1, limite = 10) {
        // Imprimir los parámetros de la función para depuración
        console.log("Obteniendo notificaciones para el usuario:", usuarioId, "Página:", pagina, "Limite:", limite);
    
        // Calculamos el offset con base en la página y el límite
        const offset = (pagina - 1) * limite;
    
        // Consulta SQL con JOIN para obtener las notificaciones junto con el tipo
        const query = `
            SELECT n.*, tn.tipo 
            FROM notificaciones n
            JOIN tipos_notificacion tn ON n.tipo_notificacion_id = tn.id
            WHERE n.usuario_id = ?
            ORDER BY n.fecha_envio DESC, n.leida ASC
            LIMIT ? OFFSET ?
        `;
    
        let connection;
        try {
            // Usamos la conexión proporcionada o creamos una nueva si no se pasa
            connection = await db.pool.getConnection();
    
            // Ejecutamos la consulta pasando los parámetros necesarios
            const [notificaciones] = await connection.query(query, [usuarioId, limite, offset]);
    
            // Devolvemos las notificaciones obtenidas, o un array vacío si no hay resultados
            return notificaciones || [];
        } catch (error) {
            // Si hay algún error, lo mostramos en consola y lo lanzamos
            console.error('Error al obtener notificaciones:', error);
            throw error;
        } finally {
            // Liberamos la conexión después de la consulta
            if (connection) connection.release();
        }
    }

    async marcarNotificacionComoLeida(notificacionId) {
        const query = 'UPDATE notificaciones SET leida = 1 WHERE id = ?';
        let connection;
        
        try {
            connection = await db.pool.getConnection();
            const [result] = await connection.query(query, [notificacionId]);
            
            if (result.affectedRows > 0) {
                return { success: true, message: 'Notificación marcada como leída' };
            } else {
                return { success: false, message: 'No se encontró la notificación' };
            }
        } catch (error) {
            console.error('Error al marcar notificación como leída:', error);
            throw error;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }
}

module.exports = new NotificacionService();
