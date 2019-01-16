"use strict";

const express = require("express");
const router = express.Router();
const categoriaController = require("../controllers/categoria");

router.post("/:codigoPais/:codigoCampania/:origen?", categoriaController.categoria);

module.exports = router;