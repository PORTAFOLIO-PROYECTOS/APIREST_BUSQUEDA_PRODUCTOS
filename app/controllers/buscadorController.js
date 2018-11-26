const parametrosEntrada = require("../models/buscador/parametrosEntrada"),
    parametrosSalida = require("../models/buscador/parametrosSalida"),
    parametrosFiltro = require("../models/buscador/parametrosFiltro"),
    
    stockRepository = require("../repository/stockRepository"),
    utils = require("../common/utils"),
    config = require("../../config"),
    baseController = require("../controllers/baseController");

async function ejecutar(parametros) {
    //- Paso 1: Consultar Redis para obtener los filtros
    let categorias = [];
    let marcas = [];
    let precios = [];
    let name = `${config.ambiente}_${config.name}_${parametros.codigoPais}_FiltrosDelBuscador`;
    let dataRedis = await baseController.obtenerDatosRedis(name, parametros.codigoPais);
    let preciosRedis = utils.selectInArray(dataRedis, config.constantes.codigoFiltroPrecio);
    let marcasRedis = utils.selectInArray(dataRedis, config.constantes.codigoFiltroMarca);
    let categoriasRedis = utils.selectInArray(dataRedis, config.constantes.codigoFiltroCategoria);
    let dataElastic = await baseController.ejecutarElasticsearch(parametros, preciosRedis);

    let productos = [],
        SAPs = [],
        filtros = [],
        total = dataElastic.hits.total;

    productos = baseController.devuelveJSONProductos(dataElastic, parametros, SAPs);

    const categoriasES = dataElastic.aggregations.categoriasFiltro.buckets;

    for (const i in categoriasRedis) {
        const element = categoriasRedis[i];
        const dataES = categoriasES.find(x => x.key == element.Nombre);
        const dataEntrada = parametros.filtroCategoria.find(x => x.idFiltro == element.Descripcion);
        categorias.push(
            new parametrosFiltro(
                element.Descripcion,
                element.Nombre,
                dataES == undefined ? 0 : dataES.doc_count,
                dataEntrada == undefined ? false : true
            ));
    }

    //-- Paso 4.3: datos => aggregations marcasFiltro
    const marcasES = dataElastic.aggregations.marcasFiltro.buckets;

    for (const i in marcasRedis) {
        const element = marcasRedis[i];
        const dataEntrada = parametros.filtroMarca.find(x => x.idFiltro.toLowerCase() == element.Descripcion.toLowerCase());
        const dataES = marcasES.find(x => x.key == element.Nombre);

        marcas.push(
            new parametrosFiltro(
                element.Descripcion,
                element.Nombre,
                dataES == undefined ? 0 : dataES.doc_count,
                dataEntrada == undefined ? false : true
            ));
    }

    //-- Paso 4.4: datos => aggregations preciosFiltro
    const preciosES = dataElastic.aggregations.preciosFiltro.buckets;

    for (const i in preciosRedis) {
        const element = preciosRedis[i];
        const dataES = preciosES.find(x => x.key == element.Nombre);
        const dataEntrada = parametros.filtroPrecio.find(x => x.idFiltro == element.Descripcion);
        precios.push(
            new parametrosFiltro(
                element.Descripcion,
                element.Nombre,
                dataES == undefined ? 0 : dataES.doc_count,
                dataEntrada == undefined ? false : true
            ));
    }

    //- Asignación Filtros 
    filtros = {
        categorias,
        marcas,
        precios
    }

    //- Paso 5: Validación de stock PROL
    if (total > 0 && config.flags.validacionStock && parametros.diaFacturacion >= 0) {
        //- Paso 5.1: Consulta APIPROL
        let dataStock = await stockRepository.Validar(SAPs, parametros.codigoPais);

        //- Paso 5.2: Validación datos stock
        for (const i in dataStock) {
            for (const j in productos) {
                if (dataStock[i].codsap == productos[j].SAP) {
                    productos[j].Stock = dataStock[i].estado == 1 ? true : false;
                    break;
                }
            }
        }
    }

    return {
        total: total,
        productos: productos,
        filtros: filtros
    }
}



function validarFiltro(val) {
    let array = [];
    if (val == null) return array;
    if (val.length > 0) {
        if (val.indexOf(null) >= 0) return array;
    }
    return val;
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
        validarFiltro(req.body.filtro.categoria),
        validarFiltro(req.body.filtro.marca),
        validarFiltro(req.body.filtro.precio)
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