const db = require('./db'); // Asegúrate de que tienes acceso a la base de datos

async function obtenerCategorias() {
    const rows = await db.query('SELECT * FROM categorias');
    return { data: rows };  // Devolvemos los datos en un objeto con la clave "data"
}

async function obtenerNiveles() {
    const rows = await db.query('SELECT * FROM niveles');
    return { data: rows };  // Devolvemos los datos en un objeto con la clave "data"
}


async function insertarCategoria(nombre) {
    return new Promise((resolve, reject) => {
        const query = 'INSERT INTO categorias (nombre) VALUES (?)'; 
        connection.query(query, [nombre], (error, results) => {
            if (error) {
                return reject(error); 
            }
            resolve({ id: results.insertId, nombre }); 
        });
    });
}


module.exports = {
    obtenerCategorias,
    obtenerNiveles,
    insertarCategoria
};
