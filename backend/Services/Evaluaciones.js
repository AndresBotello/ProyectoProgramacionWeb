const db = require('./db');
const { emptyOrRows } = require('../helper');

// Función para obtener todos los tipos de evaluación
async function obtenerTiposEvaluacion() {
    try {
        const result = await db.query('SELECT * FROM tipos_evaluacion');
        return emptyOrRows(result);
    } catch (error) {
        console.error('Error al obtener los tipos de evaluación:', error);
        throw new Error('Error al obtener los tipos de evaluación');
    }
}

async function obtenerTiposPreguntas() {
    try {
        const result = await db.query('SELECT * FROM tipos_pregunta');
        return emptyOrRows(result);
    } catch (error) {
        console.error('Error al obtener los tipos de preguntas:', error);
        throw new Error('Error al obtener los tipos de preguntas');
    }
}


async function crearEvaluacion({ curso_id, titulo, tipo_evaluacion_id }) {
    if (!curso_id || !titulo || !tipo_evaluacion_id) {
        throw new Error('Faltan campos requeridos para crear la evaluación');
    }

    const connection = await db.pool.getConnection();
    try {
        await connection.beginTransaction();

        // Insertar la evaluación en la base de datos
        const result = await connection.query(
            `INSERT INTO evaluaciones (curso_id, titulo, tipo_evaluacion_id) 
            VALUES (?, ?, ?)`,
            [curso_id, titulo, tipo_evaluacion_id]
        );
        console.log('Resultados de la inserción de evaluación:', result);

        await connection.commit();

        // Verificar si la inserción fue exitosa
        if (result[0].affectedRows) {
            return { message: 'Evaluación creada exitosamente', evaluacionId: result[0].insertId };
        } else {
            throw new Error('No se pudo crear la evaluación');
        }
    } catch (error) {
        await connection.rollback();
        console.error('Error al crear la evaluación:', error);
        throw new Error('Error en el servidor al crear la evaluación');
    } finally {
        connection.release();
    }
}



// Función para obtener las evaluaciones de un curso
async function obtenerEvaluacionesPorCurso(curso_id) {
    try {
        const result = await db.query('SELECT * FROM evaluaciones WHERE curso_id = ?', [curso_id]);
        return emptyOrRows(result);
    } catch (error) {
        console.error('Error al obtener las evaluaciones del curso:', error);
        throw new Error('Error al obtener las evaluaciones del curso');
    }
}

async function crearPregunta({ evaluacion_id, pregunta, tipo_pregunta_id, puntos }) {
    if (!evaluacion_id || !pregunta || !tipo_pregunta_id || !puntos) {
        throw new Error('Faltan campos requeridos para crear la pregunta');
    }

    const connection = await db.pool.getConnection();
    try {
        await connection.beginTransaction();

        const result = await connection.query(
            'INSERT INTO preguntas (evaluacion_id, pregunta, tipo_pregunta_id, puntos) VALUES (?, ?, ?, ?)',
            [evaluacion_id, pregunta, tipo_pregunta_id, puntos]
        );

        await connection.commit();

        if (result[0].affectedRows) {
            return { message: 'Pregunta creada exitosamente', preguntaId: result[0].insertId };
        } else {
            throw new Error('No se pudo crear la pregunta');
        }
    } catch (error) {
        await connection.rollback();
        console.error('Error al crear la pregunta:', error);
        throw new Error(`Error al crear la pregunta: ${error.message}`);
    } finally {
        connection.release();
    }
}

// Función para obtener las preguntas de una evaluación
async function obtenerPreguntasPorEvaluacion(evaluacion_id) {
    try {
        const result = await db.query('SELECT * FROM preguntas WHERE evaluacion_id = ?', [evaluacion_id]);
        return emptyOrRows(result);
    } catch (error) {
        console.error('Error al obtener las preguntas de la evaluación:', error);
        throw new Error('Error al obtener las preguntas de la evaluación');
    }
}

// Obtener una pregunta por su ID
async function obtenerPreguntaPorId(pregunta_id) {
    const [pregunta] = await db.query('SELECT * FROM preguntas WHERE id = ?', [pregunta_id]);
    return pregunta;
}

async function crearOpcion({ pregunta_id, opcion, es_correcta }) {
    if (!pregunta_id || !opcion || es_correcta === undefined) {
        throw new Error('Faltan campos requeridos para crear la opción');
    }

    const connection = await db.pool.getConnection();
    try {
        await connection.beginTransaction();

        const resultado = await connection.query(
            'INSERT INTO opciones (pregunta_id, opcion, es_correcta) VALUES (?, ?, ?)',
            [pregunta_id, opcion, es_correcta]
        );

        await connection.commit();

        return { message: 'Opción de respuesta creada exitosamente', opcionId: resultado[0].insertId };
    } catch (error) {
        await connection.rollback();
        console.error('Error al agregar la opción de respuesta:', error.message);
        throw new Error(`Error al agregar la opción de respuesta: ${error.message}`);
    } finally {
        connection.release();
    }
}


// Obtener opciones por ID de pregunta
async function obtenerOpcionesPorPregunta(pregunta_id) {
    const opciones = await db.query('SELECT * FROM opciones WHERE pregunta_id = ?', [pregunta_id]);
    return opciones;
}

// Función para crear una respuesta abierta
async function crearRespuestaAbierta({ usuario_id, pregunta_id, respuesta_texto, archivo_url }) {
    if (!usuario_id || !pregunta_id || !respuesta_texto) {
        throw new Error('Faltan campos requeridos para crear la respuesta');
    }

    try {
        await db.query(
            'INSERT INTO respuestas_abiertas (usuario_id, pregunta_id, respuesta_texto, archivo_url) VALUES (?, ?, ?, ?)',
            [usuario_id, pregunta_id, respuesta_texto, archivo_url]
        );
    } catch (error) {
        console.error('Error al enviar la respuesta abierta:', error);
        throw new Error(`Error al enviar la respuesta abierta: ${error.message}`);
    }
}

// Función para obtener las respuestas abiertas de un estudiante
async function obtenerRespuestasAbiertas(usuario_id) {
    try {
        const result = await db.query('SELECT * FROM respuestas_abiertas WHERE usuario_id = ?', [usuario_id]);
        return emptyOrRows(result);
    } catch (error) {
        console.error('Error al obtener las respuestas abiertas:', error);
        throw new Error('Error al obtener las respuestas abiertas');
    }
}

async function obtenerEvaluacionDetallePorCurso(curso_id) {
    const query = `
        SELECT 
            e.id AS evaluacion_id,
            e.titulo AS evaluacion_titulo,
            p.id AS pregunta_id,
            p.pregunta AS pregunta_texto,
            o.id AS opcion_id,
            o.opcion AS opcion_texto,
            o.es_correcta AS opcion_correcta
        FROM 
            evaluaciones e
        JOIN 
            preguntas p ON e.id = p.evaluacion_id
        LEFT JOIN 
            opciones o ON p.id = o.pregunta_id
        WHERE 
            e.curso_id = ?;
    `;

    try {
        // Utilizando db.query de forma directa, sin .promise()
        const rows = await db.query(query, [curso_id]);
        return emptyOrRows(rows);
    } catch (error) {
        console.error('Error al ejecutar la consulta:', error);
        throw error;
    }
}


// Función para crear respuesta con opción seleccionada
async function crearRespuestaConOpcion({ usuario_id, evaluacion_id, pregunta_id, opcion_seleccionada, calificacion }) {
    const query = `
        INSERT INTO respuestas_usuario (usuario_id, evaluacion_id, pregunta_id, opcion_seleccionada, calificacion)
        VALUES (?, ?, ?, ?, ?)
    `;
    const params = [usuario_id, evaluacion_id, pregunta_id, opcion_seleccionada, calificacion];
    try {
        // Ejecuta la consulta de inserción y obtén el resultado
        const [result] = await db.query(query, params);
        
        // Verifica que la respuesta se haya creado correctamente
        if (result.affectedRows > 0) {
            return { success: true, message: 'Respuesta con opción seleccionada registrada exitosamente' };
        } else {
            throw new Error('No se pudo registrar la respuesta con opción seleccionada');
        }
    } catch (error) {
        console.error('Error al crear respuesta con opción:', error.message);
        return { error: error.message };
    }
}


// Función para crear respuesta abierta
async function crearRespuestaAbierta({ usuario_id, evaluacion_id, pregunta_id, respuesta_texto, archivo_url, calificacion }) {
    const query = `
        INSERT INTO respuestas_usuario (usuario_id, evaluacion_id, pregunta_id, respuesta_texto, archivo_url, calificacion)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    const params = [usuario_id, evaluacion_id, pregunta_id, respuesta_texto, archivo_url, calificacion];
    try {
        // Ejecuta la consulta de inserción y obtén el resultado
        const [result] = await db.query(query, params);
        
        // Verifica que la respuesta se haya creado correctamente
        if (result.affectedRows > 0) {
            return { success: true, message: 'Respuesta abierta registrada exitosamente' };
        } else {
            throw new Error('No se pudo registrar la respuesta abierta');
        }
    } catch (error) {
        console.error('Error al crear respuesta abierta:', error.message);
        return { error: error.message };
    }
}


async function obtenerRespuestasPorUsuario({ usuario_id, evaluacion_id }) {
    const query = `
      SELECT r.usuario_id, r.evaluacion_id, r.pregunta_id, r.opcion_seleccionada, r.respuesta_texto, r.archivo_url, r.calificacion
      FROM respuestas_usuario r
      WHERE r.usuario_id = ? AND r.evaluacion_id = ?
    `;
    const params = [usuario_id, evaluacion_id];
  
    try {
      const [result] = await db.query(query, params);
      return result.length > 0
        ? { success: true, respuestas: result }
        : { success: false, message: 'No se encontraron respuestas para este usuario en la evaluación proporcionada' };
    } catch (error) {
      console.error('Error al obtener las respuestas por usuario:', error.message);
      return { error: error.message };
    }
}
  
  // Función para obtener el puntaje total de un usuario en una evaluación
async function obtenerPuntajeTotal(usuario_id, evaluacion_id) {
    const query = `
      SELECT 
        ru.usuario_id,
        ru.evaluacion_id,
        SUM(CASE WHEN o.es_correcta = TRUE THEN p.puntos ELSE 0 END) AS puntaje_total
      FROM 
        respuestas_usuario ru
      JOIN 
        preguntas p ON ru.pregunta_id = p.id
      JOIN 
        opciones o ON ru.opcion_seleccionada = o.id
      WHERE 
        ru.usuario_id = ? AND ru.evaluacion_id = ?
      GROUP BY 
        ru.usuario_id, ru.evaluacion_id
    `;
    const params = [usuario_id, evaluacion_id];
    try {
      const [result] = await db.query(query, params);
      if (result.length > 0) {
        return { success: true, puntaje: result[0].puntaje_total };
      } else {
        return { success: false, message: 'No se pudo obtener el puntaje de la evaluación o no se encontraron respuestas.' };
      }
    } catch (error) {
      console.error('Error al obtener el puntaje:', error.message);
      return { error: error.message };
    }
}


async function verificarEvaluacionPresentada(usuario_id, evaluacion_id) {
    const query = `
        SELECT 
            CASE 
                WHEN COUNT(*) > 0 THEN 1
                ELSE 0
            END AS ya_presento,
            COUNT(*) AS intentos
        FROM respuestas_usuario
        WHERE usuario_id = ? AND evaluacion_id = ?;
    `;

    try {
        const [results] = await db.query(query, [usuario_id, evaluacion_id]);

        // Verificar si los resultados son válidos
        if (!results || results.length === 0) {
            console.log("Resultados no encontrados o consulta vacía.");
            return {
                evaluacionPresentada: false,
                intentos: 0
            };
        }

        // Extraer los valores de los resultados
        const yaPresento = results.ya_presento === 1;
        const intentos = results.intentos;

        return {
            evaluacionPresentada: yaPresento,
            intentos: intentos
        };
    } catch (error) {
        console.error('Error al verificar evaluación presentada:', error);
        throw new Error('Error al verificar el estado de la evaluación');
    }
}




module.exports = {
    obtenerTiposEvaluacion,
    crearEvaluacion,
    obtenerEvaluacionesPorCurso,
    crearPregunta,
    obtenerPreguntasPorEvaluacion,
    crearOpcion,
    obtenerOpcionesPorPregunta,
    obtenerPreguntaPorId,
    crearRespuestaAbierta,
    obtenerTiposPreguntas,
    obtenerEvaluacionDetallePorCurso,
    crearRespuestaConOpcion,
    obtenerRespuestasPorUsuario,
    obtenerPuntajeTotal,
    verificarEvaluacionPresentada,
    obtenerRespuestasAbiertas
};
