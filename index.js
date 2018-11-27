"use strict";

const express = require("express");
const router = express.Router();

router.get("", (req, res) => {
    let ruta = __dirname.replace("app/routes", "index.html");
    res.sendFile(ruta);
});

module.exports = router;
