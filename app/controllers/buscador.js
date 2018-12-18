"use strict";

const parametrosEntrada = require("../models/buscador/parametrosEntrada"),
    utils = require("../utils/utils"),
    base = require("./baseController");

exports.busqueda = async function (req, res, next) {
    let baseController = new base(new parametrosEntrada(
        req.params.codigoPais,
        req.params.codigocampania,
        req.body.codigoConsultora,
        req.body.codigoZona,
        req.body.textoBusqueda,
        req.body.paginacion.cantidad,
        req.body.configuracion.sociaEmpresaria,
        req.body.configuracion.suscripcionActiva,
        req.body.configuracion.mdo,
        req.body.configuracion.rd,
        req.body.configuracion.rdi,
        req.body.configuracion.rdr,
        req.body.configuracion.diaFacturacion,
        req.body.personalizaciones,
        req.body.paginacion.numeroPagina,
        req.body.orden.campo,
        req.body.orden.tipo,
        utils.validarFiltro(req.body.filtro)
    ));

    try {
        let d = await baseController.ejecutarBusqueda();
        res.json(d);
        next();
    } catch (error) {
        console.log("Error en el POST BUSQUEDA: ", error);
        next(error);
    }
};