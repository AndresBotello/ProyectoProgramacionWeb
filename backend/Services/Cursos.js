const db = require('./db');
const { emptyOrRows } = require('../helper');
const cloudinary = require('../cloudinaryConfig');
const NotificacionService = require('./Notificacion');

async function obtenerTodosLosCursos() {
    const query = `
        SELECT cursos.*, categorias.nombre AS categoria, niveles.nivel AS nivel
        FROM cursos
        JOIN categorias ON cursos.categoria_id = categorias.id
        JOIN niveles ON cursos.nivel_id = niveles.id
    `;
    const rows = await db.query(query);
    return emptyOrRows(rows);
}


// Obtener un curso por su ID junto con sus lecciones
async function obtenerCursoPorId(id) {
    const cursoQuery = 'SELECT * FROM cursos WHERE id = ?';
    const leccionesQuery = 'SELECT * FROM lecciones WHERE curso_id = ?';

    const cursoRows = await db.query(cursoQuery, [id]);
    const leccionesRows = await db.query(leccionesQuery, [id]);

    if (cursoRows.length === 0) {
        return { error: 'No se encontró el curso' };
    }

    return {
        curso: cursoRows[0],
        lecciones: emptyOrRows(leccionesRows)
    };
}

async function crearCurso(curso) {
    const connection = await db.pool.getConnection();
    try {
        await connection.beginTransaction();
        
        // Insertar el curso
        const result = await connection.query(
            `INSERT INTO cursos (titulo, descripcion, contenido, categoria_id, nivel_id, instructor_id, precio) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [curso.titulo, curso.descripcion, curso.contenido, curso.categoria_id, curso.nivel_id, curso.instructor_id, curso.precio]
        );

        const cursoId = result[0].insertId;

        try {
            // Enviar notificaciones usando la misma conexión
            await NotificacionService.notificarNuevoCurso(cursoId, curso.instructor_id, connection);
            
            // Si todo va bien, hacer commit
            await connection.commit();

            return { 
                message: 'Curso creado exitosamente y notificaciones enviadas', 
                cursoId: cursoId 
            };
        } catch (notifError) {
            // Si hay error en las notificaciones, hacer rollback
            await connection.rollback();
            console.error('Error al enviar notificaciones:', notifError);
            throw notifError;
        }
    } catch (error) {
        await connection.rollback();
        console.error('Error al crear el curso:', error);
        throw error;
    } finally {
        connection.release();
    }
}


// Servicio para eliminar un curso por su ID
async function eliminarCurso(id) {
    const connection = await db.pool.getConnection();
    try {
        await connection.beginTransaction();
        
        // Eliminar el curso
        const result = await connection.query(
            'DELETE FROM cursos WHERE id = ?', [id]
        );

        await connection.commit();
        if (result[0].affectedRows) {
            return { message: 'Curso eliminado exitosamente' };
        } else {
            return { error: 'Error al eliminar el curso o el curso no existe' };
        }
    } catch (error) {
        await connection.rollback();
        console.error('Error al eliminar el curso:', error);
        return { error: 'Error en el servidor al eliminar el curso' };
    } finally {
        connection.release();
    }
}

// Servicio para actualizar/editar un curso
async function actualizarCurso(id, curso) {
    const connection = await db.pool.getConnection();
    try {
        await connection.beginTransaction();
        
        // Actualizar los detalles del curso
        const result = await connection.query(
            `UPDATE cursos 
             SET titulo = ?, descripcion = ?, contenido = ?, precio = ? 
             WHERE id = ?`,
            [curso.titulo, curso.descripcion, curso.contenido, curso.precio, id]
        );

        await connection.commit();
        if (result[0].affectedRows) {
            return { message: 'Curso actualizado exitosamente' };
        } else {
            return { error: 'Error al actualizar el curso o el curso no existe' };
        }
    } catch (error) {
        await connection.rollback();
        console.error('Error al actualizar el curso:', error);
        return { error: 'Error en el servidor al actualizar el curso' };
    } finally {
        connection.release();
    }
}


async function crearLeccion(leccion) {
    const connection = await db.pool.getConnection();
    try {
        await connection.beginTransaction();

        // Insertar la lección en la base de datos con las URLs ya generadas
        const result = await connection.query(
            `INSERT INTO lecciones (titulo, contenido, curso_id, orden, video_url, imagen_url) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                leccion.titulo,
                leccion.contenido,
                leccion.curso_id,
                leccion.orden,
                leccion.video_url,  // Usar directamente leccion.video_url
                leccion.imagen_url,  // Usar directamente leccion.imagen_url
            ]
        );
        console.log('resultados de la inserción:', result);
        await connection.commit();

        if (result[0].affectedRows) {
            return { message: 'Lección creada exitosamente', leccionId: result[0].insertId };
        } else {
            throw new Error('Error al crear la lección');
        }
    } catch (error) {
        await connection.rollback();
        console.error('Error al crear la lección:', error);
        throw new Error('Error en el servidor al crear la lección');
    } finally {
        connection.release();
    }
}



async function obtenerInstructores() {
    const rows = await db.query('SELECT * FROM usuarios WHERE tipo_usuario_id = 3');
    return { data: rows }; 
}

async function verificarInscripcion(usuarioId, cursoId) {
    const inscripcion = await db.query('SELECT * FROM inscripciones WHERE usuario_id = ? AND curso_id = ?', [usuarioId, cursoId]);
    return inscripcion.length > 0; 
}

const inscribirEstudiante = async (usuarioId, cursoId) => {
    try {
        // Verificar si el curso existe y está disponible
        const curso = await db.query('SELECT * FROM cursos WHERE id = ? AND visible = TRUE', [cursoId]);
        if (curso.length === 0) {
            throw new Error('Curso no disponible o inexistente');
        }

        // Verificar si el estudiante ya está inscrito
        const inscripcionExistente = await db.query('SELECT * FROM inscripciones WHERE usuario_id = ? AND curso_id = ?', [usuarioId, cursoId]);
        if (inscripcionExistente.length > 0) {
            throw new Error('Ya estás inscrito en este curso');
        }

        // Insertar inscripción en la base de datos
        const fechaInscripcion = new Date();
        await db.query('INSERT INTO inscripciones (usuario_id, curso_id, fecha_inscripcion) VALUES (?, ?, ?)', [usuarioId, cursoId, fechaInscripcion]);

        return { success: true, message: 'Inscripción exitosa' };
    } catch (error) {
        console.error('Error al inscribir al estudiante:', error.message);
        return { error: error.message };
    }
};

async function obtenerCursosFiltrados(categoria, nivel) {
    try {
        let query = "SELECT * FROM cursos WHERE 1=1";
        if (categoria) query += ` AND categoria_id = ${categoria}`;
        if (nivel) query += ` AND nivel_id = ${nivel}`;

        const rows = await db.query(query);
        return rows;
    } catch (error) {
        throw new Error('Error al obtener cursos filtrados');
    }
}


// Función para guardar el progreso de una lección
async function guardarProgresoLeccion(usuarioId, cursoId, leccionId) {
    const connection = await db.pool.getConnection();
    try {
        await connection.beginTransaction();
        
        // Verificar si ya existe un registro de progreso
        const [existingProgress] = await connection.query(
            'SELECT * FROM progreso_lecciones WHERE usuario_id = ? AND curso_id = ? AND leccion_id = ?',
            [usuarioId, cursoId, leccionId]
        );

        if (existingProgress.length === 0) {
            // Si no existe, crear nuevo registro
            await connection.query(
                'INSERT INTO progreso_lecciones (usuario_id, curso_id, leccion_id, completada, fecha_completado) VALUES (?, ?, ?, TRUE, NOW())',
                [usuarioId, cursoId, leccionId]
            );
        }

        await connection.commit();
        return { success: true };
    } catch (error) {
        await connection.rollback();
        console.error('Error al guardar progreso:', error);
        throw error;
    } finally {
        connection.release();
    }
}

// Función para obtener el progreso del curso
async function obtenerProgresoCurso(usuarioId, cursoId) {
    try {
        const rows = await db.query(
            'SELECT leccion_id FROM progreso_lecciones WHERE usuario_id = ? AND curso_id = ? AND completada = TRUE',
            [usuarioId, cursoId]
        );
        return rows.map(row => row.leccion_id);
    } catch (error) {
        console.error('Error al obtener progreso:', error);
        throw error;
    }
}



async function guardarCalificacion(usuarioId, cursoId, calificacion, comentario) {
    const connection = await db.pool.getConnection();
    try {
        await connection.beginTransaction();

        // Verificar si el usuario está inscrito en el curso
        const [inscripcion] = await connection.query(
            'SELECT id FROM inscripciones WHERE usuario_id = ? AND curso_id = ?',
            [usuarioId, cursoId]
        );

        if (inscripcion.length === 0) {
            throw new Error('El usuario no está inscrito en este curso');
        }

        // Verificar si ya existe una calificación
        const [calificacionExistente] = await connection.query(
            'SELECT id FROM calificaciones WHERE usuario_id = ? AND curso_id = ?',
            [usuarioId, cursoId]
        );

        let resultado;
        if (calificacionExistente.length > 0) {
            // Actualizar calificación existente
            const [updateResult] = await connection.query(
                `UPDATE calificaciones 
                 SET calificacion = ?, 
                     comentario = ?, 
                     fecha_actualizacion = CURRENT_TIMESTAMP 
                 WHERE usuario_id = ? AND curso_id = ?`,
                [calificacion, comentario || null, usuarioId, cursoId]
            );
            resultado = {
                id: calificacionExistente[0].id,
                actualizado: true,
                affected_rows: updateResult.affectedRows
            };
        } else {
            // Insertar nueva calificación
            const [insertResult] = await connection.query(
                `INSERT INTO calificaciones 
                 (usuario_id, curso_id, calificacion, comentario, fecha_creacion) 
                 VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                [usuarioId, cursoId, calificacion, comentario || null]
            );
            resultado = {
                id: insertResult.insertId,
                actualizado: false,
                affected_rows: insertResult.affectedRows
            };
        }

        // Actualizar la calificación promedio del curso
        await connection.query(
            `UPDATE cursos 
             SET calificacion_promedio = (
                SELECT AVG(calificacion) 
                FROM calificaciones 
                WHERE curso_id = ?
             )
             WHERE id = ?`,
            [cursoId, cursoId]
        );

        await connection.commit();
        return resultado;
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

module.exports = {
    crearLeccion,
    obtenerTodosLosCursos,
    obtenerCursoPorId,
    crearCurso,
    actualizarCurso,
    inscribirEstudiante,
    verificarInscripcion,
    obtenerProgresoCurso,
    guardarProgresoLeccion,
    obtenerInstructores,
    obtenerCursosFiltrados,
    guardarCalificacion,
    eliminarCurso
};
