const db = require('./db');
const { emptyOrRows } = require('../helper');
const cloudinary = require('../cloudinaryConfig');


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


module.exports = {
    crearLeccion,
    obtenerTodosLosCursos,
    obtenerCursoPorId,
    crearCurso,
    actualizarCurso,
    inscribirEstudiante,
    verificarInscripcion,
    obtenerInstructores,
    obtenerCursosFiltrados,
    eliminarCurso
};
