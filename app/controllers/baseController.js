const buscadorRepository = require("../repository/buscadorRepository"),
    parametrosSalida = require("../models/buscador/parametrosSalida"),
    utils = require("../common/utils"),
    redis = require("../common/redis"),
    sql = require("../common/sql");

var baseController = (function () {

    /**
     * retornará en formato JSON los datos de Redis o SQL
     * @param {string} key - Key del chache de redis formado por ambiente-nameAPP-isopais-[nombre]
     * @param {string} isoPais - ISO del país
     */
    async function obtenerDatosRedis(key, isoPais) {
        let dataRedis = await redis.getRedis(key);
        if (dataRedis == null || dataRedis == "") {
            //- Consulta en SQLServer
            let resultSql = JSON.stringify(await sql.filtrosData(isoPais));
            //- Inserción de la consulta en REDIS
            let setRedis = await redis.setRedis(name, resultSql);
            if (!setRedis) return false;
            dataRedis = resultSql;
        }
        return JSON.parse(dataRedis);
    }

    /**
     * Devuelve array con los productos validados
     * @param {json} data - Resultado de la consulta de ES
     * @param {array} parametros - Parametros que recibe el api
     * @param {array} SAPs - Retorno de codigos SAPS
     */
    function devuelveJSONProductos(data, parametros, SAPs){
        let productos = [];

        for (const key in data.hits.hits) {
            const element = data.hits.hits[key],
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

        return productos;
    }

    /**
     * Ejecuta la query de ES
     * @param {array} parametros - Parametros que recibe el API
     * @param {array} rangosRedis - Datos de redis
     */
    async function ejecutarElasticsearch(parametros, rangosRedis) {
        return new Promise((resolve, reject) => {
            buscadorRepository.buscar(parametros, rangosRedis).then((resp) => {
                resolve(resp);
            }, (err) => {
                console.log('Error: al consultar ES');
                reject(err);
            });
        });
    }

    function devuelveJSONFiltros(data, filtros){
        
    }

    return {
        obtenerDatosRedis: obtenerDatosRedis,
        ejecutarElasticsearch: ejecutarElasticsearch,
        devuelveJSONProductos: devuelveJSONProductos
    }
})();

module.exports = baseController;