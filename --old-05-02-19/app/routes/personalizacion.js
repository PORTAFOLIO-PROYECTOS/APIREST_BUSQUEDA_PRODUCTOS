const express = require("express");
const router = express.Router();

const personalizacionController = require("../controllers/personalizacion");

router.get(
    "/:codigoPais" +
    "/:codigoCampania" +
    "/:codigoConsultora" +
    "/:origen?",
    personalizacionController.obtener
);

module.exports = router;