const parametrosEntrada = require("../models/buscador/parametrosEntrada"),
    utils = require("../common/utils"),
    config = require("../../config"),
    baseController = require("../controllers/baseController");

/**
 * Devuel un array en formato json con los resultados de la busqueda
 * @param {array} parametros - Parametros que recibe la consultora
 */
async function ejecutar(parametros) {
    let name = `${config.ambiente}_${config.name}_${parametros.codigoPais}_FiltrosDelBuscador`,
        dataRedis = await baseController.obtenerDatosRedis(name, parametros.codigoPais),
        dataElastic = await baseController.ejecutarElasticsearch(parametros, dataRedis),
        productos = [],
        SAPs = [],
        filtros = [],
        total = dataElastic.hits.total;

    productos = baseController.devuelveJSONProductos(dataElastic, parametros, SAPs);

    productos = await baseController.validarStock(SAPs, parametros.codigoPais, parametros.diaFacturacion, productos);

    filtros = baseController.devuelveJSONFiltros(dataElastic, dataRedis, parametros);

    return {
        total: total,
        productos: productos,
        filtros: filtros
    }
}

exports.busqueda = async function (req, res, next) {

    let parametros = new parametrosEntrada(
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
        utils.validarFiltro(req.body.filtro.categoria),
        utils.validarFiltro(req.body.filtro.marca),
        utils.validarFiltro(req.body.filtro.precio)
    );
    
    try {
        let d = await ejecutar(parametros);
        res.json(d);
        next();
    } catch (error) {
        console.log('Error en el POST: ', error);
        next(error);
    }
};