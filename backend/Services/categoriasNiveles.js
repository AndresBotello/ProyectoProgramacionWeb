const db = require('./db'); // Asegúrate de que tienes acceso a la base de datos

async function obtenerCategorias() {
    const rows = await db.query('SELECT * FROM categorias');
    return { data: rows };  // Devolvemos los datos en un objeto con la clave "data"
}

async function obtenerNiveles() {
    const rows = await db.query('SELECT * FROM niveles');
    return { data: rows };  // Devolvemos los datos en un objeto con la clave "data"
}

module.exports = {
    obtenerCategorias,
    obtenerNiveles
};
