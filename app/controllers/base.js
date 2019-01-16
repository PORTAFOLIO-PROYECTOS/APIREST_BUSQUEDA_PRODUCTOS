"use strict";

const buscadorRepository = require("../repositories/buscador"),
    stockRepository = require("../repositories/stock"),
    recomendacionRepository = require("../repositories/recomendacion"),
    categoriaRepository = require("../repositories/categoria"),
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
            let name = `${config.ambiente}_${config.name}_${this.parametros.codigoPais}_SeccionesFiltroBuscador`,
                dataRedis = await this.obtenerDatosRedis(name),
                dataElastic = await this.ejecutarQueryBuscador(dataRedis),
                productos = [],
                SAPs = [],
                filtros = [],
                total = dataElastic.hits.total;

            productos = this.devuelveJSONProductos(dataElastic, SAPs);

            productos = await this.validarStock(SAPs, this.parametros.codigoPais, this.parametros.diaFacturacion, productos, false);

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
            let dataElastic = await this.ejecutarQueryRecomendacion(),
                productos = [],
                SAPs = [],
                total = dataElastic.hits.total;

            productos = this.devuelveJSONProductos(dataElastic, SAPs);
            // productos = await this.validarStock(SAPs, this.parametros.codigoPais, this.parametros.diaFacturacion, productos, true);
            //productos = this.devuelveJSONProductosRecomendacion(dataElastic);
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
            let name = `${config.ambiente}_${config.name}_${this.parametros.codigoPais}_CategoriasBusquedaMobile`,
                data = await this.ejecutarQueryCategoria(),
                dataRedis = await this.obtenerDatosRedis(name, "categoria");
            return {
                dataRedis: dataRedis,
                data: data
            }
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
     * Ejecuta la query de ES
     * @param {array} rangosRedis - Datos de redis
     */
    async ejecutarQueryBuscador(dataRedis) {
        try {
            return new Promise((resolve, reject) => {
                buscadorRepository.buscar(this.parametros, dataRedis).then((resp) => {
                    resolve(resp);
                }, (err) => {
                    console.log("Error: al consultar ES");
                    reject(err);
                });
            });
        } catch (error) {
            console.log("Error en ejecutarQueryBuscador", error);
            return [];
        }
    }

    /**
     * Ejecuta la query de ES
     */
    async ejecutarQueryRecomendacion() {
        try {
            return new Promise((resolve, reject) => {
                recomendacionRepository.buscar(this.parametros).then((resp) => {
                    resolve(resp);
                }, (err) => {
                    console.log("Error: al consultar ES");
                    reject(err);
                });
            });
        } catch (error) {
            console.log("Error en ejecutarQueryRecomendacion", error);
            return [];
        }
    }

    async ejecutarQueryCategoria() {
        try {
            const categoria = new categoriaRepository();
            return new Promise((resolve, reject) => {
                categoria.ejecutar(this.parametros).then((resp) => {
                    console.log("resp", resp);
                    resolve(resp);
                }, (err) => {
                    console.log("Error: al consultar ES");
                    reject(err);
                });
            });
        } catch (error) {
            console.log("Error en ejecutarQueryCategoria", error);
            return [];
        }
    }

    /**
     * Devuelve json de productos validados con el STOCK
     * @param {array} SAPs - Codigos SAPs a validar
     * @param {string} isoPais - ISO del país
     * @param {int} diaFacturacion - Día de facturación 
     * @param {array} productos - Lista de productos a validar
     * @param {boolean} recomendados - Flag para validar si es una recomendación u otro
     */
    async validarStock(SAPs, isoPais, diaFacturacion, productos, recomendados) {
        try {
            if (config.flags.validacionStock && diaFacturacion >= 0) {
                let dataStock = await stockRepository.Validar(SAPs, isoPais);
                for (const i in dataStock) {
                    for (const j in productos) {
                        if (dataStock[i].codsap === productos[j].SAP) {
                            productos[j].Stock = dataStock[i].estado === 1 ? true : false;
                            break;
                        }
                    }
                }

                if (recomendados) {
                    let array = [];
                    for (const key in productos) {
                        const element = productos[key];
                        if (element.Stock === true) {
                            array.push(element);
                        }
                    }
                    productos = array;
                }
            }

            return productos;
        } catch (error) {
            console.log("Error en validarStock", error);
            return productos;
        }
    }

    /**
     * Devuelve array con los productos validados
     * @param {json} data - Resultado de la consulta de ES
     * @param {array} SAPs - Retorno de codigos SAPS
     */
    devuelveJSONProductos(data, SAPs) {
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

            if (SAPs.indexOf(source.codigoProducto) < 0 && (source.codigoProducto !== undefined || source.codigoProducto !== null)) {
                SAPs.push(source.codigoProducto);
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
        return resultado;
    }

    /**
     * Devuelve productos que solamente son de Estrategia Individual y pertenece al catálogo físico de L'Bel, Ésika o Cyzone
     * @param {array} data - Resultado de ES
     */
    /*devuelveJSONProductosRecomendacion(data) {
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
                source.estrategiaId
            ));

            if (productos.length === this.parametros.cantidadProductos) return productos;
        }

        return productos;
    }*/
}

module.exports = baseController;