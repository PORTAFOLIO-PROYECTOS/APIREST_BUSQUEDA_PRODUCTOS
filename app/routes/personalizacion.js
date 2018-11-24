const express = require('express');
const router = express.Router();

const personalizacionController = require('../controllers/personalizacionController');

router.get(
    '/:codigoPais' +
    '/:codigoCampania' +
    '/:codigoConsultora' +
    '/:origen?',
    personalizacionController.obtener
);

module.exports = router;