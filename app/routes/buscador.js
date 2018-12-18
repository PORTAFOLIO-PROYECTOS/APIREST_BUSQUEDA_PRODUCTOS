"use strict";

const express = require("express");
const router = express.Router();

const buscadorController = require("../controllers/buscador");

router.post("/:codigoPais/:codigocampania/:origen?", buscadorController.busqueda);

module.exports = router;