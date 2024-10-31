const db = require('./db');
const { emptyOrRows } = require('../helper');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require('../config');

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
        const isEmail = /\S+@\S+\.\S+/.test(usuario.correo);
        const query = isEmail
            ? `SELECT * FROM usuarios WHERE correo = ?`
            : `SELECT * FROM usuarios WHERE nombre = ?`;

        const usuarioResultado = await db.query(query, [usuario.correo]);
        if (!usuarioResultado || usuarioResultado.length === 0) {
            return { message: "No se encontró el usuario" };
        }
        const usuarioDb = usuarioResultado[0];
        const esValido = await bcrypt.compare(usuario.contrasena, usuarioDb.contrasena);
        if (!esValido) {
            return { message: "Usuario o Contraseña Incorrecta" };
        }
        const token = jwt.sign(
            {
                id: usuarioDb.id,
                nombre: usuarioDb.nombre,
                correo: usuarioDb.correo,
                tipo_usuario_id: usuarioDb.tipo_usuario_id
            },
            config.secret_key
        );

        return {
            token,
            nombre: usuarioDb.nombre,
            tipo_usuario_id: usuarioDb.tipo_usuario_id
        };
    } catch (error) {
        console.error('Error en el login', error.message);
        throw new Error('Error en el proceso de inicio de sesión');
    }
}

// Registrar un nuevo usuario
async function registrarUsuario(usuario) {
    const connection = await db.pool.getConnection();
    try {
        await connection.beginTransaction();
        const hashpassword = await bcrypt.hash(usuario.contrasena, 10);

        const existingUser = await db.query('SELECT correo FROM usuarios WHERE correo = ?', [usuario.correo]);
        if (existingUser.length > 0) {
            return { error: 'El correo ya está en uso' };
        }

        const [result] = await connection.query(
            `INSERT INTO usuarios (nombre, correo, contrasena, tipo_usuario_id, imagen_perfil) 
            VALUES (?, ?, ?, ?, ?)`,
            [usuario.nombre, usuario.correo, hashpassword, usuario.tipo_usuario_id, usuario.imagen_perfil]
        );
        await connection.commit();
        if (result.affectedRows) {
            return { message: 'Usuario registrado exitosamente' };
        } else {
            return { error: 'Error al registrar el usuario' };
        }
    } catch (error) {
        await connection.rollback();
        console.error('Error durante el registro del usuario:', error);
        return { error: 'Error en el servidor' };
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

// Obtener un usuario por ID
async function buscarUsuarioPorId(id) {
    const rows = await db.query('SELECT * FROM usuarios WHERE id = ?', [id]);
    return emptyOrRows(rows);
}

module.exports = {
    Todos,
    obtenerInstructores, 
    registrarUsuario,
    buscarUsuarioPorCorreo,
    buscarUsuarioPorId,
    login,
    actualizarUsuario,
    eliminarUsuario
};
