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




module.exports = router;
