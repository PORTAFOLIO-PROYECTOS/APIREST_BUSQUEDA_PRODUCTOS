const express = require("express");
const router = express.Router();

const recomendacionController = require("../controllers/personalizacionController");

router.post("/:codigoPais/:codigocampania/:origen?", recomendacionController.obtener);

module.exports = router;