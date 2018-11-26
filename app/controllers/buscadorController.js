const parametrosEntrada = require("../models/buscador/parametrosEntrada"),
    parametrosSalida = require("../models/buscador/parametrosSalida"),
    parametrosFiltro = require("../models/buscador/parametrosFiltro"),
    buscadorRepository = require("../repository/buscadorRepository"),
    stockRepository = require("../repository/stockRepository"),
    utils = require("../common/utils"),
    config = require("../../config"),
    redis = require("../common/redis"),
    sql = require("../common/sql");

async function ejecutar(parametros) {
    //- Paso 1: Consultar Redis para obtener los filtros
    let categorias = [];
    let marcas = [];
    let precios = [];
    let name = `${config.ambiente}_${config.name}_${parametros.codigoPais}_FiltrosDelBuscador`;
    let dataRedis = await redis.getRedis(name);
    //- Paso 2: Validar si existe data en redis
    if (dataRedis == null || dataRedis == "") {

        //- Paso 2.1: Select a sql
        let resultSql = JSON.stringify(await sql.filtrosData(parametros.codigoPais));

        //- Paso 2.2: insertando en Redis
        let setRedis = await redis.setRedis(name, resultSql);
        if (!setRedis) return false;
        dataRedis = resultSql;
    }

    dataRedis = JSON.parse(dataRedis);

    let preciosRedis = utils.selectInArray(dataRedis, config.constantes.codigoFiltroPrecio);
    let marcasRedis = utils.selectInArray(dataRedis, config.constantes.codigoFiltroMarca);
    let categoriasRedis = utils.selectInArray(dataRedis, config.constantes.codigoFiltroCategoria);

    //- Paso 3: consultando Elastic
    let dataElastic = await getElasticsearch(parametros, preciosRedis);

    //- Paso 4: validación de resultados
    let productos = [],
        SAPs = [],
        filtros = [],
        total = dataElastic.hits.total;

    //- Paso 4.1: datos => hits
    for (const key in dataElastic.hits.hits) {
        const element = dataElastic.hits.hits[key],
            source = element._source,
            imagen = utils.getUrlImagen(source.imagen, parametros.codigoPais, source.imagenOrigen, parametros.codigoCampania, source.marcaId);

        productos.push(
            new parametrosSalida(
                source.cuv,
                source.codigoProducto,
                imagen ? imagen : "no_tiene_imagen.jpg",
                source.descripcion,
                source.valorizado ? source.valorizado : 0,
                source.precio,
                source.marcaId,
                source.tipoPersonalizacion,
                source.codigoEstrategia ? source.codigoEstrategia : 0,
                source.codigoTipoEstrategia ? source.codigoTipoEstrategia : '0',
                source.tipoEstrategiaId ? source.tipoEstrategiaId : 0,
                source.limiteVenta ? source.limiteVenta : 0,
                true,
                source.estrategiaId
            ));

        if (SAPs.indexOf(source.codigoProducto) < 0 && (source.codigoProducto != undefined || source.codigoProducto != null)) {
            SAPs.push(source.codigoProducto);
        }
    }

    //- Paso 4.2: datos => aggregations categoriasFiltro
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

async function getElasticsearch(parametros, rangosRedis) {
    return new Promise((resolve, reject) => {
        buscadorRepository.buscar(parametros, rangosRedis).then((resp) => {
            resolve(resp);
        }, (err) => {
            console.log('Error: al consultar ES');
            reject(err);
        });
    });
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