const express = require("express");
const router = express.Router();

const personalizacionController = require("../controllers/recomendacionController");

router.get(
    "/:codigoPais" +
    "/:codigoCampania" +
    "/:codigoConsultora" +
    "/:origen?",
    personalizacionController.recomendaciones
);

module.exports = router;