"use strict";

const buscadorRepository = require("../repository/buscadorRepository"),
    stockRepository = require("../repository/stockRepository"),
    parametrosSalida = require("../models/buscador/parametrosSalida"),
    parametrosFiltro = require("../models/buscador/parametrosFiltro"),
    utils = require("../common/utils"),
    config = require("../../config"),
    redis = require("../common/redis"),
    sql = require("../common/sql");

class baseController {
    /**
     * retornará en formato JSON los datos de Redis o SQL
     * @param {string} key - Key del chache de redis formado por ambiente-nameAPP-isopais-[nombre]
     * @param {string} isoPais - ISO del país
     */
    async obtenerDatosRedis(key, isoPais) {
        try {
            let dataRedis = await redis.getRedis(key);
            if (dataRedis == null || dataRedis == "") {
                let resultSql = JSON.stringify(await sql.filtrosData(isoPais));//- Consulta en SQLServer
                let setRedis = await redis.setRedis(name, resultSql);//- Inserción de la consulta en REDIS
                if (!setRedis) return false;
                dataRedis = resultSql;
            }
            return JSON.parse(dataRedis);
        } catch (error) {
            console.log("error en obtenerDatosRedis", error);
            return [];
        }
    }

    /**
     * Ejecuta la query de ES
     * @param {array} parametros - Parametros que recibe el API
     * @param {array} rangosRedis - Datos de redis
     */
    async ejecutarElasticsearch(parametros, dataRedis) {
        try {
            return new Promise((resolve, reject) => {
                buscadorRepository.buscar(parametros, dataRedis).then((resp) => {
                    resolve(resp);
                }, (err) => {
                    console.log('Error: al consultar ES');
                    reject(err);
                });
            });
        } catch (error) {
            console.log("Error en ejecutarElasticsearch", error);
            return [];
        }
    }

    /**
     * Devuelve json de productos validados con el STOCK
     * @param {array} SAPs - Codigos SAPs a validar
     * @param {string} isoPais - ISO del país
     * @param {int} diaFacturacion - Día de facturación 
     * @param {array} productos - Lista de productos a validar
     */
    async validarStock(SAPs, isoPais, diaFacturacion, productos) {
        try {
            if (config.flags.validacionStock && diaFacturacion >= 0) {
                console.log('antes de ejecutar stock');
                let dataStock = await stockRepository.Validar(SAPs, isoPais);
                console.log('despues de ejecutar stock', dataStock);
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

            return productos;
        } catch (error) {
            console.log("Error en validarStock", productos);
            return [];
        }
    }

    /**
     * Devuelve array con los productos validados
     * @param {json} data - Resultado de la consulta de ES
     * @param {array} parametros - Parametros que recibe el api
     * @param {array} SAPs - Retorno de codigos SAPS
     */
    devuelveJSONProductos(data, parametros, SAPs) {
        let productos = [];

        for (const key in data.hits.hits) {
            const element = data.hits.hits[key],
                source = element._source,
                imagen = utils.getUrlImagen(source.imagen, parametros.codigoPais, source.imagenOrigen, parametros.codigoCampania, source.marcaId);

            productos.push(new parametrosSalida(
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

        return productos;
    }

    /**
     * Devuelve en formato JSON todos los filtros, aunque tengan ceros
     * @param {array} data - Resultado de la consulta de ES
     * @param {array} dataRedis - Resultado de la consulta de REDIS
     * @param {array} parametros - Parametro que recibe la consultora
     */
    devuelveJSONFiltros(data, dataRedis, parametros) {
        let preciosRedis = utils.selectInArray(dataRedis, config.constantes.codigoFiltroPrecio),
            marcasRedis = utils.selectInArray(dataRedis, config.constantes.codigoFiltroMarca),
            categoriasRedis = utils.selectInArray(dataRedis, config.constantes.codigoFiltroCategoria),
            categoriasES = data.aggregations.categoriasFiltro.buckets,
            marcasES = data.aggregations.marcasFiltro.buckets,
            preciosES = data.aggregations.preciosFiltro.buckets,
            categorias = [],
            marcas = [],
            precios = [];

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

        return {
            categorias,
            marcas,
            precios
        }
    }
}

module.exports = baseController;