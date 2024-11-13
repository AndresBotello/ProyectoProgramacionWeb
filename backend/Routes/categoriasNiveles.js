const express = require('express');
const router = express.Router();
const { obtenerCategorias, obtenerNiveles } = require('../Services/categoriasNiveles');

router.get('/categorias', async (req, res) => {
    try {
        const categorias = await obtenerCategorias();
        res.status(200).json({ data: categorias }); 
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener las categorías' });
    }
});

router.get('/niveles', async (req, res) => {
    try {
        const niveles = await obtenerNiveles();
        res.status(200).json({ data: niveles }); 
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los niveles' });
    }
});

// Ruta para insertar una nueva categoría
router.post('/insertar-categorias', async (req, res) => {
    const { nombre } = req.body; 

    if (!nombre) {
        return res.status(400).json({ message: 'El nombre de la categoría es requerido' });
    }

    try {
        const nuevaCategoria = await insertarCategoria(nombre);
        res.status(201).json({ message: 'Categoría creada exitosamente', data: nuevaCategoria });
    } catch (error) {
        res.status(500).json({ message: 'Error al insertar la categoría', error: error.message });
    }
});




module.exports = router;
