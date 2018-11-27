const express = require("express");
const router = express.Router();

const recomendacionController = require("../controllers/recomendacionController");

router.post("/:codigoPais/:codigocampania/:origen?", recomendacionController.recomendaciones);

module.exports = router;