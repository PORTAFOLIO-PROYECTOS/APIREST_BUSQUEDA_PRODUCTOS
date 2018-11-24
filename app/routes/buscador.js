const express = require('express');
const router = express.Router();

const buscadorController = require('../controllers/buscadorController');

router
    .post('/:codigoPais/:codigocampania/:origen?', buscadorController.busqueda);

module.exports = router;