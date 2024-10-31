const db = require('./db');
const { emptyOrRows } = require('../helper');

// Obtener todos los cursos
async function obtenerTodosLosCursos() {
    const rows = await db.query('SELECT * FROM cursos');
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
        
        // Verificar si el contenido llega correctamente
        console.log(curso.contenido);  // Verifica si el contenido se recibe correctamente en el backend

        const result = await connection.query(
            `INSERT INTO cursos (titulo, descripcion, contenido, categoria_id, nivel_id, instructor_id, precio) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [curso.titulo, curso.descripcion, curso.contenido, curso.categoria_id, curso.nivel_id, curso.instructor_id, curso.precio]
        );

        await connection.commit();
        if (result[0].affectedRows) {
            return { message: 'Curso creado exitosamente', cursoId: result[0].insertId };
        } else {
            return { error: 'Error al crear el curso' };
        }
    } catch (error) {
        await connection.rollback();
        console.error('Error al crear el curso:', error);
        return { error: 'Error en el servidor al crear el curso' };
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


// Crear una nueva lección
async function crearLeccion(leccion) {
    const connection = await db.pool.getConnection();
    try {
        await connection.beginTransaction();

        const result = await connection.query(
            `INSERT INTO lecciones (titulo, contenido, video_url, curso_id, orden) 
             VALUES (?, ?, ?, ?, ?)`,
            [leccion.titulo, leccion.contenido, leccion.video_url, leccion.curso_id, leccion.orden]
        );

        await connection.commit();
        if (result[0].affectedRows) {
            return { message: 'Lección creada exitosamente', leccionId: result[0].insertId };
        } else {
            return { error: 'Error al crear la lección' };
        }
    } catch (error) {
        await connection.rollback();
        console.error('Error al crear la lección:', error);
        return { error: 'Error en el servidor al crear la lección' };
    } finally {
        connection.release();
    }
}



async function obtenerInstructores() {
    const rows = await db.query('SELECT * FROM usuarios WHERE tipo_usuario_id = 3');
    return { data: rows };  // Devolvemos los instructores en la clave "data"
}

module.exports = {
    crearLeccion,
    obtenerTodosLosCursos,
    obtenerCursoPorId,
    crearCurso,
    actualizarCurso,
    obtenerInstructores,
    eliminarCurso
};
