"use strict";

const parametrosEntrada = require("../models/recomendacion/parametros-entrada"),
    base = require("./base");

exports.recomendaciones = async function (req, res, next){
    let baseController = new base(new parametrosEntrada(
        req.params.codigoPais,
        req.params.codigocampania,
        req.params.origen,
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
        req.body.configuracion.mostrarProductoConsultado
    ));

    try {
        let e = await baseController.ejecutarRecomendaciones();
        res.json(e);
        next();
    } catch (error) {
        console.log("Error en el POST RECOMENDACIONES: ", error);
    }
}