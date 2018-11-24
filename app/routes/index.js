const express = require('express');
const router = express.Router();

router.get("", (req, res) => {
    res.json('Api de busqueda de productos.');
});

module.exports = router;
