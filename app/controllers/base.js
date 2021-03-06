"use strict";

const ejecucionRepositories = require("./ejecucion-repostories"),
    parametrosSalida = require("../models/buscador/parametros-salida"),
    parametrosFiltro = require("../models/buscador/parametros-filtro"),
    utils = require("../utils/utils"),
    config = require("../../config"),
    redisConectar = require("../utils/redis"),
    redis = new redisConectar(),
    sql = require("../repositories/sql-datos");

class baseController {

    constructor(parametros) {
        this.parametros = parametros
    }
    /**
     * Devuelve un array en formato json con los resultados de la busqueda
     */
    async ejecutarBusqueda() {
        try {
            const repositories = new ejecucionRepositories(this.parametros);
            let name = `${config.ambiente}_${config.name}_${this.parametros.codigoPais}_SeccionFiltroBuscador`,
                dataRedis = await this.obtenerDatosRedis(name),
                dataElastic = await repositories.ejecutarQueryBuscador(dataRedis),
                productos = [],
                CUVs = [],
                filtros = [],
                total = dataElastic.hits.total;

            productos = this.devuelveJSONProductos(dataElastic, CUVs);

            productos = await repositories.validarStock(CUVs, productos, false);

            filtros = this.devuelveJSONFiltros(dataElastic, dataRedis);

            return {
                total: total,
                productos: productos,
                filtros: filtros
            }
        } catch (error) {
            console.log("Error en ejecutarBusqueda", error);
            return [];
        }
    }

    /**
     * Devuelve JSON con los productos recomendados
     */
    async ejecutarRecomendaciones() {
        try {
            const repositories = new ejecucionRepositories(this.parametros);
            let dataElastic = await repositories.ejecutarQueryRecomendacion(),
                productos = [],
                SAPs = [],
                total = dataElastic.hits.total;

            productos = this.devuelveJSONProductos(dataElastic, SAPs);

            if (productos.length === 0) total = 0;
            total = productos.length;

            return {
                total: total,
                productos: productos
            }
        } catch (error) {
            console.log("Error en baseController/ejecutarRecomendaciones:", error);
        }
    }

    /**
     * Devuelve JSON con las categorías que tiene disponible la consultora
     */
    async ejecutarCategoria() {
        try {
            const repositories = new ejecucionRepositories(this.parametros);
            let name = `${config.ambiente}_${config.name}_${this.parametros.codigoPais}_CategoriasBusquedaMobile`,
                data = await repositories.ejecutarQueryCategoria(),
                dataRedis = await this.obtenerDatosRedis(name, "categoria");

            return this.devuelveJSONCategorias(data, dataRedis);

        } catch (error) {
            console.log("Error en baseController/ejecutarCategoria:", error);
        }
    }

    /**
     * retornará en formato JSON los datos de Redis o SQL
     * @param {string} key - Key del chache de redis formado por ambiente-nameAPP-isopais-[nombre]
     * @param {string} isoPais - ISO del país
     */
    async obtenerDatosRedis(key, method) {
        try {
            let sqlDatos = new sql(this.parametros.codigoPais);
            let dataRedis = await redis.get(key);
            if (dataRedis === null || dataRedis === "") {
                let resultSql = "";

                if (method === "categoria") {
                    resultSql = JSON.stringify(await sqlDatos.listaCategoria());
                } else {
                    resultSql = JSON.stringify(await sqlDatos.listaBusqueda());
                }

                let setRedis = await redis.set(key, resultSql);//- Inserción de la consulta en REDIS
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
     * Devuelve array con los productos validados
     * @param {json} data - Resultado de la consulta de ES
     * @param {array} CUVs - Retorno de codigos CUVs
     */
    devuelveJSONProductos(data, CUVs) {
        let productos = [];

        for (const key in data.hits.hits) {
            const element = data.hits.hits[key],
                source = element._source,
                imagen = utils.getUrlImagen(source.imagen, this.parametros.codigoPais, source.imagenOrigen, this.parametros.codigoCampania, source.marcaId);

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
                source.codigoTipoEstrategia ? source.codigoTipoEstrategia : "0",
                source.tipoEstrategiaId ? source.tipoEstrategiaId : 0,
                source.limiteVenta ? source.limiteVenta : 0,
                true,
                source.estrategiaId,
                source.materialGanancia ? true : false
            ));

            if (CUVs.indexOf(source.cuv) < 0 && (source.cuv !== undefined || source.cuv !== null)) {
                CUVs.push(source.cuv);
            }
        }

        return productos;
    }

    /**
     * Devuelve en formato JSON todos los filtros, aunque tengan ceros
     * @param {array} data - Resultado de la consulta de ES
     * @param {array} dataRedis - Resultado de la consulta de REDIS
     */
    devuelveJSONFiltros(data, dataRedis) {
        let resultado = [],
            filtros = utils.distinctInArrayRedis(dataRedis);

        for (const key in filtros) {
            const item = filtros[key],
                armando = [],
                filtroEnSeccionRedis = utils.selectInArray(dataRedis, item.id),
                filtroResultadoES = data.aggregations[`${item.nombre}-${item.id}`].buckets,
                filtroEnParametros = this.parametros.filtro.find(x => x.NombreGrupo === item.nombre);

            if (filtroResultadoES.length > 0) {
                for (const i in filtroEnSeccionRedis) {
                    const filter = filtroEnSeccionRedis[i];
                    const dataES = filtroResultadoES.find(x => x.key === filter.FiltroNombre);
                    const dataEntrada = filtroEnParametros === undefined ? filtroEnParametros : filtroEnParametros.Opciones.find(x => x.IdFiltro === filter.Codigo);
                    armando.push(
                        new parametrosFiltro(
                            filter.Codigo,
                            filter.FiltroNombre,
                            dataES === undefined ? 0 : dataES.doc_count,
                            dataEntrada === undefined ? false : true
                        )
                    );
                }
                resultado.push({
                    NombreGrupo: item.nombre,
                    Opciones: armando
                });
            }
        }
        return resultado;
    }

    devuelveJSONCategorias(dataES, dataRedis) {
        if (!dataES || !dataRedis) return [];
        let dataCategorias = dataES.aggregations.unique_categoria.buckets,
            resultado = [];

        for (const key in dataRedis) {
            const element = dataRedis[key];
            let categoria = dataCategorias.find(x => x.key === element.Nombre);

            resultado.push(
                {
                    codigo: element.codigo,
                    nombre: element.Nombre,
                    cantidad: categoria ? categoria.doc_count : 0,
                    imagen: element.imagen,
                    imagenAncha: element.imagenAncha === 1 ? true : false
                }
            );
        }

        return resultado;
    }
}

module.exports = baseController;