const db = require('./db');
const { emptyOrRows } = require('../helper');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require('../config');
const sendVerificationEmail = require('../utils/email');


// Obtener todos los usuarios
async function Todos() {
    const rows = await db.query('SELECT * FROM usuarios');
    const data = emptyOrRows(rows);
    return { data };
}

// Obtener solo los usuarios con el rol de Instructor
async function obtenerInstructores() {
    const rows = await db.query('SELECT * FROM usuarios WHERE tipo_usuario_id = ?', [3]); // Asegúrate de que el 3 es el tipo_usuario_id para instructores
    const data = emptyOrRows(rows);
    return { data };
}

// Obtener un usuario por correo
async function buscarUsuarioPorCorreo(correo) {
    const rows = await db.query('SELECT * FROM usuarios WHERE correo = ?', [correo]);
    if (rows.length === 0) {
        return null;
    }
    return rows[0];
}

// Iniciar sesión
async function login(usuario) {
    try {
        const query = /\S+@\S+\.\S+/.test(usuario.correo)
            ? 'SELECT * FROM usuarios WHERE correo = ?'
            : 'SELECT * FROM usuarios WHERE nombre = ?';

        const usuarioResultado = await db.query(query, [usuario.correo]);
        if (!usuarioResultado.length) return { message: "No se encontró el usuario" };

        const usuarioDb = usuarioResultado[0];
        if (usuarioDb.verificado !== 1) {
            return { message: "Por favor, verifica tu cuenta antes de iniciar sesión" };
        }

        const esValido = await bcrypt.compare(usuario.contrasena, usuarioDb.contrasena);
        if (!esValido) return { message: "Usuario o Contraseña Incorrecta" };

        const token = jwt.sign(
            {
                id: usuarioDb.id,
                nombre: usuarioDb.nombre,
                correo: usuarioDb.correo,
                tipo_usuario_id: usuarioDb.tipo_usuario_id
            },
            config.secret_key,
            { expiresIn: '1h' } 
        );

        return {
            id: usuarioDb.id,
            token,
            nombre: usuarioDb.nombre,
            correo: usuarioDb.correo,
            tipo_usuario_id: usuarioDb.tipo_usuario_id,
            imagen_perfil: usuarioDb.imagen_perfil
        };
    } catch (error) {
        console.error('Error en el login', error.message);
        throw new Error('Error en el proceso de inicio de sesión');
    }
}

async function registrarUsuario(usuario) {
    const connection = await db.pool.getConnection();
    try {
        await connection.beginTransaction();
        const hashpassword = await bcrypt.hash(usuario.contrasena, 10);

        const existingUser = await db.query('SELECT correo FROM usuarios WHERE correo = ?', [usuario.correo]);
        if (existingUser.length > 0) {
            console.log("Correo ya registrado:", usuario.correo);
            return { error: 'El correo ya está en uso' };
        }

        const codigoVerificacion = Math.floor(100000 + Math.random() * 900000).toString();
        console.log("Código de verificación generado:", codigoVerificacion);

        const [result] = await connection.query(
            `INSERT INTO usuarios (nombre, correo, contrasena, tipo_usuario_id, imagen_perfil, codigo_verificacion, verificado) 
            VALUES (?, ?, ?, ?, ?, ?, false)`,
            [usuario.nombre, usuario.correo, hashpassword, usuario.tipo_usuario_id, usuario.imagen_perfil, codigoVerificacion]
        );

        await connection.commit();
        console.log("Usuario registrado con ID:", result.insertId);

        await sendVerificationEmail(usuario.correo, codigoVerificacion);
        return { message: 'Usuario registrado exitosamente. Revisa tu correo para verificar tu cuenta.' };
    } catch (error) {
        await connection.rollback();
        console.error('Error en el registro', error);
        return { error: 'Error en el servidor' };
    } finally {
        connection.release();
    }
}

// Verificación de cuenta
async function verificarCodigo(correo, codigo) {
    const connection = await db.pool.getConnection();
    try {
        const [result] = await connection.query(
            'SELECT * FROM usuarios WHERE correo = ? AND codigo_verificacion = ?',
            [correo, codigo]
        );
        if (!result.length) return { error: 'Código de verificación incorrecto' };

        await connection.query('UPDATE usuarios SET verificado = true WHERE correo = ?', [correo]);
        return { message: 'Cuenta verificada exitosamente' };
    } catch (error) {
        console.error('Error en verificación', error);
        throw new Error('Error en el proceso de verificación');
    } finally {
        connection.release();
    }
}



async function actualizarUsuario(id, usuario) {
    const connection = await db.pool.getConnection();
    try {
        await connection.beginTransaction();

        // Obtener el usuario actual
        const [existingUser] = await connection.query('SELECT * FROM usuarios WHERE id = ?', [id]);

        if (existingUser.length === 0) {
            return { error: 'Usuario no encontrado' };
        }

        const usuarioActual = existingUser[0];
        
        // Mantener los valores actuales si no se envían en la solicitud
        const nombre = usuario.nombre || usuarioActual.nombre;
        const correo = usuario.correo || usuarioActual.correo;
        const tipo_usuario_id = usuario.tipo_usuario_id || usuarioActual.tipo_usuario_id;

        const result = await connection.query(
            `UPDATE usuarios 
             SET nombre = ?, correo = ?, tipo_usuario_id = ? 
             WHERE id = ?`,
            [nombre, correo, tipo_usuario_id, id]
        );

        await connection.commit();
        if (result[0].affectedRows) {
            return { message: 'Usuario actualizado exitosamente' };
        } else {
            return { error: 'Error al actualizar el usuario o el usuario no existe' };
        }
    } catch (error) {
        await connection.rollback();
        console.error('Error al actualizar el usuario:', error);
        return { error: 'Error en el servidor al actualizar el usuario' };
    } finally {
        connection.release();
    }
}

async function eliminarUsuario(id) {
    const connection = await db.pool.getConnection();
    try {
        await connection.beginTransaction();

        const result = await connection.query(
            'DELETE FROM usuarios WHERE id = ?', [id]
        );

        await connection.commit();
        if (result[0].affectedRows) {
            return { message: 'Usuario eliminado exitosamente' };
        } else {
            return { error: 'Error al eliminar el usuario o el usuario no existe' };
        }
    } catch (error) {
        await connection.rollback();
        console.error('Error al eliminar el usuario:', error);
        return { error: 'Error en el servidor al eliminar el usuario' };
    } finally {
        connection.release();
    }
}


async function buscarUsuarioPorId(id) {
    const rows = await db.query('SELECT id, nombre, correo, imagen_perfil FROM usuarios WHERE id = ?', [id]);
    if (rows.length === 0) {
        return null;
    }
    return rows[0];
}

async function actualizarVerificado(correo) {
    await db.query('UPDATE usuarios SET verificado = true, codigo_verificacion = NULL WHERE correo = ?',  [correo]);
}

async function actualizarCodigoRecuperacion(correo, codigoRecuperacion){
    await db.query ('UPDATE usuarios SET codigo_recuperacion = ? WHERE correo = ?', [codigoRecuperacion, correo,]);
}

async function cambiarContrasena(correo, nuevaContrasena) {
    await db.query ('UPDATE usuarios SET  contrasena = ? WHERE correo = ?', [nuevaContrasena, correo]);
}

async function actualizarPerfil(id, usuario) {
    const connection = await db.pool.getConnection();
    try {
        await connection.beginTransaction();

        // Verifica si el usuario existe
        const [existingUser] = await connection.query('SELECT * FROM usuarios WHERE id = ?', [id]);
        if (existingUser.length === 0) {
            return { error: 'Usuario no encontrado' };
        }

        // Actualiza los campos solo si son proporcionados
        let updateFields = [];
        let updateValues = [];

        if (usuario.nombre) {
            updateFields.push('nombre = ?');
            updateValues.push(usuario.nombre);
        }

        if (usuario.correo) {
            updateFields.push('correo = ?');
            updateValues.push(usuario.correo);
        }

        if (usuario.imagen_perfil) {
            updateFields.push('imagen_perfil = ?');
            updateValues.push(usuario.imagen_perfil);
        }

        updateValues.push(id);

        const query = `UPDATE usuarios SET ${updateFields.join(', ')} WHERE id = ?`;
        const [result] = await connection.query(query, updateValues);
        await connection.commit();

        if (result.affectedRows === 0) {
            return { error: 'No se pudo actualizar el perfil' };
        }

        // Retorna el usuario actualizado
        const [updatedUser] = await connection.query('SELECT id, nombre, correo, imagen_perfil FROM usuarios WHERE id = ?', [id]);

        return { 
            message: 'Perfil actualizado correctamente',
            data: updatedUser[0]
        };

    } catch (error) {
        await connection.rollback();
        console.error('Error al actualizar el perfil:', error);
        return { error: 'Error en el servidor' };
    } finally {
        connection.release();
    }
}



module.exports = {
    Todos,
    obtenerInstructores, 
    registrarUsuario,
    buscarUsuarioPorCorreo,
    buscarUsuarioPorId,
    login,
    actualizarUsuario,
    actualizarVerificado,
    actualizarCodigoRecuperacion,
    cambiarContrasena,
    actualizarPerfil,
    verificarCodigo,
    eliminarUsuario
};
