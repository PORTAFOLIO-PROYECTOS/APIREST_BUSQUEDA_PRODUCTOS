"use strict";

const parametrosEntrada = require("../models/categoria/parametros-entrada"),
    base = require("./base");

exports.categoria = async function (req, res, next){
    let baseController = new base(new parametrosEntrada(
        req.params.codigoPais,
        req.params.codigoCampania,
        req.body.codigoConsultora,
        req.body.codigoZona,
        req.body.configuracion.sociaEmpresaria,
        req.body.configuracion.suscripcionActiva,
        req.body.configuracion.mdo,
        req.body.configuracion.rd,
        req.body.configuracion.rdi,
        req.body.configuracion.rdr,
        req.body.configuracion.diaFacturacion,
        req.body.personalizaciones,
    ));

    try {
        let r = await baseController.ejecutarCategoria();
        res.json(r);
        next();
    } catch (error) {
        console.log("Error en el POST CATEGORIA: ", error);
    }
}