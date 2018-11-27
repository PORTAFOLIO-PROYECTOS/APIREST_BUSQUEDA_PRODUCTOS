"use strict";

const parametrosEntrada = require("../models/recomendacion/parametrosEntrada"),
    base = require("../controllers/baseController");

exports.recomendaciones = async function (req, res, next){
    let baseController = new base(new parametrosEntrada(
        req.params.codigoPais,
        req.params.codigocampania,
        req.body.codigoConsultora,
        req.body.codigoZona,
        req.body.cuv,
        req.body.codigoProducto,
        req.body.cantidadProductos,
        req.body.personalizaciones,
        req.body.configuracion.sociaEmpresaria,
        req.body.configuracion.suscripcionActiva,
        req.body.configuracion.mdo,
        req.body.configuracion.rd,
        req.body.configuracion.rdi,
        req.body.configuracion.rdr,
        req.body.configuracion.diaFacturacion,
    ));

    try {
        //falta
        res.json();
        next();
    } catch (error) {
        console.log("Error en el POST RECOMENDACIONES: ", error);
    }
}